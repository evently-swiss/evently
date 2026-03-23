'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

function requireSuperAdmin() {
  return auth().then((session) => {
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized');
    }
    return session;
  });
}

export type LoungeBoxInput = {
  label: string;
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: string;
  color?: string | null;
  capacity?: number | null;
  minConsumation?: number | null;
};

export async function createLayout(venueId: string, name: string): Promise<string> {
  await requireSuperAdmin();

  const layout = await prisma.loungeLayout.create({
    data: { venueId, name },
  });

  revalidatePath(`/admin/venues/${venueId}/lounge-layout`);
  return layout.id;
}

export async function saveLayout(
  layoutId: string,
  boxes: LoungeBoxInput[],
): Promise<void> {
  await requireSuperAdmin();

  const layout = await prisma.loungeLayout.findUnique({ where: { id: layoutId } });
  if (!layout) throw new Error('Layout not found');

  await prisma.$transaction([
    prisma.loungeBox.deleteMany({ where: { layoutId } }),
    prisma.loungeBox.createMany({
      data: boxes.map((b) => ({
        layoutId,
        label: b.label,
        number: b.number,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        shape: b.shape ?? 'rect',
        color: b.color ?? null,
        capacity: b.capacity ?? null,
        minConsumation:
          b.minConsumation != null ? new Prisma.Decimal(b.minConsumation) : null,
      })),
    }),
    prisma.loungeLayout.update({
      where: { id: layoutId },
      data: { updatedAt: new Date() },
    }),
  ]);

  revalidatePath(`/admin/venues/${layout.venueId}/lounge-layout`);
}
