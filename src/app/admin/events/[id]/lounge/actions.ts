'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function confirmReservation(reservationId: string, eventId: string): Promise<void> {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN') return;

  await prisma.loungeReservation.update({
    where: { id: reservationId },
    data: { status: 'CONFIRMED' },
  });

  revalidatePath(`/admin/events/${eventId}/lounge`);
}

export async function cancelReservation(reservationId: string, eventId: string): Promise<void> {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN') return;

  await prisma.loungeReservation.update({
    where: { id: reservationId },
    data: { status: 'CANCELLED' },
  });

  revalidatePath(`/admin/events/${eventId}/lounge`);
}
