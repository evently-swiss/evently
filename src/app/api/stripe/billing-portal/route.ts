import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sub = await prisma.operatorSubscription.findFirst({
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const body = req.body ? await req.json().catch(() => ({})) : {};
  const returnUrl = (body as { returnUrl?: string }).returnUrl ?? `${appUrl}/account/billing`;

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: portalSession.url });
}
