import prisma from '@/lib/prisma';

/** Returns true if the given user has an active (or trialing) OperatorSubscription.
 *  SUPER_ADMIN is always considered active — they are the platform owner. */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const [user, sub] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.operatorSubscription.findUnique({ where: { userId }, select: { status: true } }),
  ]);
  if (user?.role === 'SUPER_ADMIN') return true;
  return sub?.status === 'active' || sub?.status === 'trialing';
}

/**
 * Returns true if the operator who created the given event has an active subscription.
 * Used to gate public-facing routes like /s/[slug] and /door/[eventId].
 */
export async function eventOperatorHasActiveSubscription(eventId: string): Promise<boolean> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      createdByUserId: true,
    },
  });
  if (!event) return false;
  return hasActiveSubscription(event.createdByUserId);
}
