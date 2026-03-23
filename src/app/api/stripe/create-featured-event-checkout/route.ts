import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import stripe from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const priceId = process.env.STRIPE_FEATURED_EVENT_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: 'Featured event price not configured' }, { status: 500 });
  }

  let body: { eventId?: string; successUrl?: string; cancelUrl?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { eventId } = body;
  if (!eventId) {
    return NextResponse.json({ error: 'eventId is required' }, { status: 422 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, name: true },
  });
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const successUrl = body.successUrl ?? `${appUrl}/admin/events/${eventId}?featured=success`;
  const cancelUrl = body.cancelUrl ?? `${appUrl}/admin/events/${eventId}`;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: session.user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      userId: session.user.id,
      eventId,
      type: 'featured_event',
    },
    payment_intent_data: {
      metadata: {
        userId: session.user.id,
        eventId,
        type: 'featured_event',
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
