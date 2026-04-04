/**
 * Analytics calculation utilities.
 * All functions operate on plain data structures so they can be tested without Prisma.
 */

export type GuestWithCheckIn = {
  id: string;
  plusOnesCount: number;
  signupLinkId: string | null;
  promoterId: string | null;
  checkIn: { checkedInAt: Date } | null;
};

export type SignupLinkSummary = {
  id: string;
  title: string | null;
  slug: string;
  type: string;
};

export type PromoterSummary = {
  id: string;
  name: string | null;
};

/** Core attendance numbers for an event. */
export function calcAttendanceStats(
  guests: GuestWithCheckIn[],
  capacity: number | null,
) {
  const totalGuestRecords = guests.length;
  const totalPlusOnes = guests.reduce((s, g) => s + g.plusOnesCount, 0);
  const totalHeads = totalGuestRecords + totalPlusOnes;

  const checkedInRecords = guests.filter((g) => g.checkIn !== null);
  const checkedInHeads =
    checkedInRecords.length +
    checkedInRecords.reduce((s, g) => s + g.plusOnesCount, 0);

  const noShowHeads = totalHeads - checkedInHeads;
  const attendanceRate =
    totalHeads > 0 ? Math.round((checkedInHeads / totalHeads) * 100) : 0;

  const capacityUtilization =
    capacity && capacity > 0
      ? Math.round((checkedInHeads / capacity) * 100)
      : null;

  return {
    totalHeads,
    totalGuestRecords,
    totalPlusOnes,
    checkedInHeads,
    noShowHeads,
    attendanceRate,
    capacityUtilization,
  };
}

/** Group check-ins by hour-of-day (0–23). Returns a sorted array of { hour, count }. */
export function calcCheckInVelocity(
  guests: GuestWithCheckIn[],
): { hour: number; count: number }[] {
  const byHour: Record<number, number> = {};

  for (const guest of guests) {
    if (!guest.checkIn) continue;
    const hour = new Date(guest.checkIn.checkedInAt).getHours();
    byHour[hour] = (byHour[hour] ?? 0) + 1 + guest.plusOnesCount;
  }

  return Object.entries(byHour)
    .map(([h, count]) => ({ hour: Number(h), count }))
    .sort((a, b) => a.hour - b.hour);
}

/** Per-signup-link guest counts and check-in rates. */
export function calcLinkBreakdown(
  guests: GuestWithCheckIn[],
  links: SignupLinkSummary[],
): {
  linkId: string;
  title: string | null;
  slug: string;
  type: string;
  totalHeads: number;
  checkedInHeads: number;
  checkInRate: number;
}[] {
  const linkMap: Record<
    string,
    { totalHeads: number; checkedInHeads: number }
  > = {};

  for (const link of links) {
    linkMap[link.id] = { totalHeads: 0, checkedInHeads: 0 };
  }

  for (const guest of guests) {
    if (!guest.signupLinkId || !linkMap[guest.signupLinkId]) continue;
    const heads = 1 + guest.plusOnesCount;
    linkMap[guest.signupLinkId].totalHeads += heads;
    if (guest.checkIn) {
      linkMap[guest.signupLinkId].checkedInHeads += heads;
    }
  }

  return links.map((link) => {
    const { totalHeads, checkedInHeads } = linkMap[link.id] ?? {
      totalHeads: 0,
      checkedInHeads: 0,
    };
    return {
      linkId: link.id,
      title: link.title,
      slug: link.slug,
      type: link.type,
      totalHeads,
      checkedInHeads,
      checkInRate:
        totalHeads > 0 ? Math.round((checkedInHeads / totalHeads) * 100) : 0,
    };
  });
}

/** Per-promoter guest counts and check-in rates. */
export function calcPromoterBreakdown(
  guests: GuestWithCheckIn[],
  promoters: PromoterSummary[],
): {
  promoterId: string;
  name: string | null;
  totalHeads: number;
  checkedInHeads: number;
  conversionRate: number;
}[] {
  const map: Record<string, { totalHeads: number; checkedInHeads: number }> =
    {};

  for (const p of promoters) {
    map[p.id] = { totalHeads: 0, checkedInHeads: 0 };
  }

  for (const guest of guests) {
    if (!guest.promoterId || !map[guest.promoterId]) continue;
    const heads = 1 + guest.plusOnesCount;
    map[guest.promoterId].totalHeads += heads;
    if (guest.checkIn) {
      map[guest.promoterId].checkedInHeads += heads;
    }
  }

  return promoters
    .map((p) => {
      const { totalHeads, checkedInHeads } = map[p.id] ?? {
        totalHeads: 0,
        checkedInHeads: 0,
      };
      return {
        promoterId: p.id,
        name: p.name,
        totalHeads,
        checkedInHeads,
        conversionRate:
          totalHeads > 0
            ? Math.round((checkedInHeads / totalHeads) * 100)
            : 0,
      };
    })
    .filter((p) => p.totalHeads > 0)
    .sort((a, b) => b.totalHeads - a.totalHeads);
}
