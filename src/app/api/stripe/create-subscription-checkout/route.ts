import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const priceId = process.env.STRIPE_OPERATOR_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const body = req.body ? await req.json().catch(() => ({})) : {};
  const successUrl = (body as { successUrl?: string }).successUrl ?? `${appUrl}/admin`;
  const cancelUrl = (body as { cancelUrl?: string }).cancelUrl ?? `${appUrl}/pricing`;

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer_email: session.user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId: session.user.id },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
