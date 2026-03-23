import prisma from '@/lib/prisma';
import { LoungeStatus } from '@prisma/client';

export type LoungeBoxData = {
  id: string;
  label: string;
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: string;
  color: string | null;
  capacity: number | null;
  minConsumation: number | null;
  isActive: boolean;
};

export type LoungeLayoutData = {
  id: string;
  name: string;
  width: number;
  height: number;
  boxes: LoungeBoxData[];
};

export type LoungeAvailabilityEntry = {
  number: number;
  status: LoungeStatus;
};

// Status priority for colouring: higher index = higher display priority
const STATUS_PRIORITY: LoungeStatus[] = ['CANCELLED', 'PENDING', 'CONFIRMED', 'ARRIVED'];

function topStatus(statuses: LoungeStatus[]): LoungeStatus {
  let best: LoungeStatus = 'CANCELLED';
  for (const s of statuses) {
    if (STATUS_PRIORITY.indexOf(s) > STATUS_PRIORITY.indexOf(best)) {
      best = s;
    }
  }
  return best;
}

/**
 * Return the layout for an event: event-specific override first, then venue active layout.
 * Public read — no auth required.
 */
export async function getEventLayout(eventId: string): Promise<LoungeLayoutData | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      loungeLayoutId: true,
      venueId: true,
      loungeLayout: {
        select: {
          id: true,
          name: true,
          width: true,
          height: true,
          boxes: {
            where: { isActive: true },
            orderBy: { number: 'asc' },
            select: {
              id: true,
              label: true,
              number: true,
              x: true,
              y: true,
              width: true,
              height: true,
              shape: true,
              color: true,
              capacity: true,
              minConsumation: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!event) return null;

  if (event.loungeLayout) {
    return serializeLayout(event.loungeLayout);
  }

  if (event.venueId) {
    const venueLayout = await prisma.loungeLayout.findFirst({
      where: { venueId: event.venueId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        width: true,
        height: true,
        boxes: {
          where: { isActive: true },
          orderBy: { number: 'asc' },
          select: {
            id: true,
            label: true,
            number: true,
            x: true,
            y: true,
            width: true,
            height: true,
            shape: true,
            color: true,
            capacity: true,
            minConsumation: true,
            isActive: true,
          },
        },
      },
    });
    if (venueLayout) return serializeLayout(venueLayout);
  }

  return null;
}

/**
 * Return active layout for a venue with its boxes.
 */
export async function getVenueLayout(venueId: string): Promise<LoungeLayoutData | null> {
  const layout = await prisma.loungeLayout.findFirst({
    where: { venueId, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      width: true,
      height: true,
      boxes: {
        where: { isActive: true },
        orderBy: { number: 'asc' },
        select: {
          id: true,
          label: true,
          number: true,
          x: true,
          y: true,
          width: true,
          height: true,
          shape: true,
          color: true,
          capacity: true,
          minConsumation: true,
          isActive: true,
        },
      },
    },
  });

  return layout ? serializeLayout(layout) : null;
}

/**
 * Return reserved lounge numbers with their highest-priority status for an event.
 */
export async function getLayoutAvailability(
  layoutId: string,
  eventId: string,
): Promise<LoungeAvailabilityEntry[]> {
  const reservations = await prisma.loungeReservation.findMany({
    where: {
      eventId,
      status: { not: 'CANCELLED' },
    },
    select: {
      loungeNumbers: true,
      status: true,
    },
  });

  const statusMap = new Map<number, LoungeStatus[]>();
  for (const r of reservations) {
    for (const num of r.loungeNumbers) {
      if (!statusMap.has(num)) statusMap.set(num, []);
      statusMap.get(num)!.push(r.status);
    }
  }

  return Array.from(statusMap.entries()).map(([number, statuses]) => ({
    number,
    status: topStatus(statuses),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeLayout(raw: any): LoungeLayoutData {
  return {
    id: raw.id,
    name: raw.name,
    width: raw.width,
    height: raw.height,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boxes: raw.boxes.map((b: any): LoungeBoxData => ({
      id: b.id,
      label: b.label,
      number: b.number,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      shape: b.shape,
      color: b.color,
      capacity: b.capacity,
      minConsumation: b.minConsumation !== null ? Number(b.minConsumation) : null,
      isActive: b.isActive,
    })),
  };
}
