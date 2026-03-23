import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prisma';

// Default featured duration: 30 days
const FEATURED_DAYS = 30;

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpsert(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      if (paymentIntent.metadata?.type === 'featured_event') {
        await handleFeaturedEventPayment(paymentIntent);
      }
      break;
    }
    default:
      // ignore unhandled event types
      break;
  }

  return NextResponse.json({ received: true });
}

async function resolveUserId(subscription: Stripe.Subscription): Promise<string | null> {
  if (subscription.metadata?.userId) return subscription.metadata.userId;

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const existing = await prisma.operatorSubscription.findUnique({
    where: { stripeCustomerId: customerId },
    select: { userId: true },
  });
  if (existing) return existing.userId;

  const sessions = await stripe.checkout.sessions.list({
    customer: customerId,
    limit: 10,
  });
  for (const session of sessions.data) {
    if (session.metadata?.userId) return session.metadata.userId;
  }

  return null;
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const userId = await resolveUserId(subscription);
  if (!userId) return;

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  const priceId = subscription.items.data[0]?.price?.id ?? '';
  const currentPeriodEnd = new Date(
    (subscription.items.data[0]?.current_period_end ?? subscription.billing_cycle_anchor) * 1000,
  );
  const status = subscription.status;

  await prisma.operatorSubscription.upsert({
    where: { userId },
    update: { stripeCustomerId: customerId, stripeSubscriptionId: subscription.id, stripePriceId: priceId, status, currentPeriodEnd },
    create: { userId, stripeCustomerId: customerId, stripeSubscriptionId: subscription.id, stripePriceId: priceId, status, currentPeriodEnd },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.operatorSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'canceled' },
  });
}

async function handleFeaturedEventPayment(paymentIntent: Stripe.PaymentIntent) {
  const { userId, eventId } = paymentIntent.metadata ?? {};
  if (!userId || !eventId) return;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + FEATURED_DAYS);

  await prisma.featuredEvent.upsert({
    where: { eventId },
    update: {
      stripePaymentIntentId: paymentIntent.id,
      paidByUserId: userId,
      expiresAt,
    },
    create: {
      eventId,
      stripePaymentIntentId: paymentIntent.id,
      paidByUserId: userId,
      expiresAt,
    },
  });
}
