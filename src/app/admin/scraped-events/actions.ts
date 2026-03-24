'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/** Publish the linked Event (DRAFT → PUBLISHED) and mark ScrapedEvent as RECONCILED. */
export async function approveScrapedEvent(scrapedEventId: string): Promise<void> {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN') return;

  const scraped = await prisma.scrapedEvent.findUnique({
    where: { id: scrapedEventId },
    include: { event: { select: { id: true } } },
  });
  if (!scraped) return;

  if (scraped.event) {
    await prisma.event.update({
      where: { id: scraped.event.id },
      data: { status: 'PUBLISHED' },
    });
  }

  await prisma.scrapedEvent.update({
    where: { id: scrapedEventId },
    data: { syncStatus: 'RECONCILED', checkedAt: new Date() },
  });

  revalidatePath('/admin/scraped-events');
}

/** Mark a ScrapedEvent as DUPLICATE so it is hidden from the review queue. */
export async function dismissScrapedEvent(scrapedEventId: string): Promise<void> {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN') return;

  await prisma.scrapedEvent.update({
    where: { id: scrapedEventId },
    data: { syncStatus: 'DUPLICATE', checkedAt: new Date() },
  });

  revalidatePath('/admin/scraped-events');
}
