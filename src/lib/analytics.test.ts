import { describe, expect, it } from "vitest";
import {
  calcAttendanceStats,
  calcCheckInVelocity,
  calcLinkBreakdown,
  calcPromoterBreakdown,
  type GuestWithCheckIn,
  type SignupLinkSummary,
  type PromoterSummary,
} from "./analytics";

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeGuest(
  overrides: Partial<GuestWithCheckIn> & { id: string },
): GuestWithCheckIn {
  return {
    plusOnesCount: 0,
    signupLinkId: null,
    promoterId: null,
    checkIn: null,
    ...overrides,
  };
}

const checkedInAt = new Date("2024-06-01T22:30:00"); // hour = 22 local

// ─── calcAttendanceStats ───────────────────────────────────────────────────────

describe("calcAttendanceStats", () => {
  it("returns zeros when no guests", () => {
    const stats = calcAttendanceStats([], null);
    expect(stats.totalHeads).toBe(0);
    expect(stats.checkedInHeads).toBe(0);
    expect(stats.noShowHeads).toBe(0);
    expect(stats.attendanceRate).toBe(0);
    expect(stats.capacityUtilization).toBeNull();
  });

  it("counts plus-ones in totalHeads", () => {
    const guests = [makeGuest({ id: "g1", plusOnesCount: 3 })];
    const stats = calcAttendanceStats(guests, null);
    expect(stats.totalHeads).toBe(4);
    expect(stats.totalPlusOnes).toBe(3);
  });

  it("includes plus-ones in checkedInHeads", () => {
    const guests = [
      makeGuest({ id: "g1", plusOnesCount: 2, checkIn: { checkedInAt } }),
      makeGuest({ id: "g2", plusOnesCount: 0 }),
    ];
    const stats = calcAttendanceStats(guests, null);
    // g1 = 1 + 2 plus-ones = 3 checked in; g2 = not checked in
    expect(stats.checkedInHeads).toBe(3);
    expect(stats.noShowHeads).toBe(1); // g2
    expect(stats.attendanceRate).toBe(75); // 3 / 4 = 75%
  });

  it("computes attendance rate as 100% when all checked in", () => {
    const guests = [
      makeGuest({ id: "g1", checkIn: { checkedInAt } }),
      makeGuest({ id: "g2", checkIn: { checkedInAt } }),
    ];
    const stats = calcAttendanceStats(guests, null);
    expect(stats.attendanceRate).toBe(100);
  });

  it("returns capacityUtilization when capacity is set", () => {
    const guests = [
      makeGuest({ id: "g1", checkIn: { checkedInAt } }),
    ];
    const stats = calcAttendanceStats(guests, 10);
    expect(stats.capacityUtilization).toBe(10);
  });

  it("returns null capacityUtilization when capacity is null", () => {
    const guests = [makeGuest({ id: "g1", checkIn: { checkedInAt } })];
    const stats = calcAttendanceStats(guests, null);
    expect(stats.capacityUtilization).toBeNull();
  });
});

// ─── calcCheckInVelocity ───────────────────────────────────────────────────────

describe("calcCheckInVelocity", () => {
  it("returns empty array when no check-ins", () => {
    expect(calcCheckInVelocity([])).toEqual([]);
  });

  it("groups by hour correctly", () => {
    const g1 = makeGuest({
      id: "g1",
      checkIn: { checkedInAt: new Date("2024-06-01T21:00:00") },
    });
    const g2 = makeGuest({
      id: "g2",
      checkIn: { checkedInAt: new Date("2024-06-01T21:45:00") },
    });
    const g3 = makeGuest({
      id: "g3",
      checkIn: { checkedInAt: new Date("2024-06-01T22:00:00") },
    });
    const result = calcCheckInVelocity([g1, g2, g3]);
    expect(result.length).toBe(2);
    const hour21 = result.find((r) => r.hour === 21);
    const hour22 = result.find((r) => r.hour === 22);
    expect(hour21?.count).toBe(2);
    expect(hour22?.count).toBe(1);
  });

  it("includes plus-ones in count", () => {
    const guest = makeGuest({
      id: "g1",
      plusOnesCount: 2,
      checkIn: { checkedInAt },
    });
    const result = calcCheckInVelocity([guest]);
    // hour 22: 1 guest + 2 plus-ones = 3
    expect(result[0].count).toBe(3);
  });

  it("skips guests without check-in", () => {
    const guests = [makeGuest({ id: "g1" })];
    expect(calcCheckInVelocity(guests)).toEqual([]);
  });

  it("returns results sorted by hour", () => {
    const guests = [
      makeGuest({ id: "g1", checkIn: { checkedInAt: new Date("2024-06-01T23:00:00") } }),
      makeGuest({ id: "g2", checkIn: { checkedInAt: new Date("2024-06-01T20:00:00") } }),
    ];
    const result = calcCheckInVelocity(guests);
    expect(result[0].hour).toBe(20);
    expect(result[1].hour).toBe(23);
  });
});

// ─── calcLinkBreakdown ────────────────────────────────────────────────────────

describe("calcLinkBreakdown", () => {
  const links: SignupLinkSummary[] = [
    { id: "l1", title: "VIP", slug: "vip", type: "PROMOTER" },
    { id: "l2", title: null, slug: "general", type: "GENERAL" },
  ];

  it("returns all links with zero counts when no guests", () => {
    const result = calcLinkBreakdown([], links);
    expect(result.length).toBe(2);
    result.forEach((r) => {
      expect(r.totalHeads).toBe(0);
      expect(r.checkedInHeads).toBe(0);
      expect(r.checkInRate).toBe(0);
    });
  });

  it("assigns guests to correct links", () => {
    const guests = [
      makeGuest({ id: "g1", signupLinkId: "l1" }),
      makeGuest({ id: "g2", signupLinkId: "l1", checkIn: { checkedInAt } }),
      makeGuest({ id: "g3", signupLinkId: "l2", plusOnesCount: 1 }),
    ];
    const result = calcLinkBreakdown(guests, links);
    const vip = result.find((r) => r.linkId === "l1")!;
    const general = result.find((r) => r.linkId === "l2")!;
    expect(vip.totalHeads).toBe(2);
    expect(vip.checkedInHeads).toBe(1);
    expect(vip.checkInRate).toBe(50);
    expect(general.totalHeads).toBe(2); // 1 + 1 plus-one
    expect(general.checkedInHeads).toBe(0);
  });

  it("ignores guests with null signupLinkId", () => {
    const guests = [makeGuest({ id: "g1" })]; // no signupLinkId
    const result = calcLinkBreakdown(guests, links);
    result.forEach((r) => expect(r.totalHeads).toBe(0));
  });
});

// ─── calcPromoterBreakdown ────────────────────────────────────────────────────

describe("calcPromoterBreakdown", () => {
  const promoters: PromoterSummary[] = [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
  ];

  it("returns empty array when no promoters have guests", () => {
    expect(calcPromoterBreakdown([], promoters)).toEqual([]);
  });

  it("calculates conversion rate", () => {
    const guests = [
      makeGuest({ id: "g1", promoterId: "p1" }),
      makeGuest({ id: "g2", promoterId: "p1", checkIn: { checkedInAt } }),
      makeGuest({ id: "g3", promoterId: "p2", checkIn: { checkedInAt } }),
    ];
    const result = calcPromoterBreakdown(guests, promoters);
    const alice = result.find((r) => r.promoterId === "p1")!;
    const bob = result.find((r) => r.promoterId === "p2")!;
    expect(alice.totalHeads).toBe(2);
    expect(alice.checkedInHeads).toBe(1);
    expect(alice.conversionRate).toBe(50);
    expect(bob.conversionRate).toBe(100);
  });

  it("sorts by totalHeads descending", () => {
    const guests = [
      makeGuest({ id: "g1", promoterId: "p2" }),
      makeGuest({ id: "g2", promoterId: "p2" }),
      makeGuest({ id: "g3", promoterId: "p1" }),
    ];
    const result = calcPromoterBreakdown(guests, promoters);
    expect(result[0].promoterId).toBe("p2");
  });

  it("excludes promoters with no guests", () => {
    const guests = [makeGuest({ id: "g1", promoterId: "p1" })];
    const result = calcPromoterBreakdown(guests, promoters);
    expect(result.length).toBe(1);
    expect(result[0].promoterId).toBe("p1");
  });
});
