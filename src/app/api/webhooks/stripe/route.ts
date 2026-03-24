import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";

// Duration (in days) granted per featured-event purchase type.
const FEATURED_DURATION_DAYS = 30;
const FEATURED_PACK_SIZE = 5;

function resolvePlanId(subscription: Stripe.Subscription): string {
  return subscription.items.data[0]?.price?.id ?? "unknown";
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): "ACTIVE" | "TRIALING" | "CANCELED" {
  if (stripeStatus === "trialing") return "TRIALING";
  if (stripeStatus === "canceled" || stripeStatus === "unpaid") return "CANCELED";
  return "ACTIVE";
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "payment") {
          // One-time featured-event purchase.
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;

          if (!paymentIntentId) break;

          // Payment Links must carry metadata: eventId, userId, and optionally pack=true
          const { eventId, userId, pack } = session.metadata ?? {};
          if (!eventId || !userId) {
            console.warn("Featured purchase missing eventId/userId metadata", session.id);
            break;
          }

          const featuredUntil = new Date();
          const days = pack === "true"
            ? FEATURED_DURATION_DAYS * FEATURED_PACK_SIZE
            : FEATURED_DURATION_DAYS;
          featuredUntil.setDate(featuredUntil.getDate() + days);

          await prisma.featuredEvent.upsert({
            where: { stripePaymentIntentId: paymentIntentId },
            create: { eventId, userId, stripePaymentIntentId: paymentIntentId, featuredUntil },
            update: { featuredUntil },
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const status = mapStripeStatus(subscription.status);
        // Use trial_end as the period boundary during trials, billing_cycle_anchor otherwise
        const periodEndUnix = subscription.trial_end ?? subscription.billing_cycle_anchor;
        const periodEnd = new Date(periodEndUnix * 1000);
        const planId = resolvePlanId(subscription);

        const existing = await prisma.operatorSubscription.findFirst({
          where: {
            OR: [
              { stripeSubscriptionId: subscription.id },
              { stripeCustomerId: customerId },
            ],
          },
        });

        if (existing) {
          await prisma.operatorSubscription.update({
            where: { id: existing.id },
            data: {
              status,
              periodEnd,
              planId,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: customerId,
            },
          });
        } else {
          // Resolve userId by looking up the Stripe customer's email.
          const customer = await stripe.customers.retrieve(customerId);
          const email =
            !customer.deleted && "email" in customer ? customer.email : null;
          if (!email) {
            console.warn("Cannot resolve userId — no email on Stripe customer", customerId);
            break;
          }

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            console.warn("No Evently user found for email", email);
            break;
          }

          await prisma.operatorSubscription.create({
            data: {
              userId: user.id,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscription.id,
              status,
              planId,
              periodEnd,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.operatorSubscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: "CANCELED" },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          invoice.parent?.subscription_details?.subscription != null
            ? typeof invoice.parent.subscription_details.subscription === "string"
              ? invoice.parent.subscription_details.subscription
              : invoice.parent.subscription_details.subscription.id
            : null;

        if (subscriptionId) {
          console.warn("Payment failed for subscription", subscriptionId);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Error handling webhook event", event.type, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
