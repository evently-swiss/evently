import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindFirst } = vi.hoisted(() => ({
    mockFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
    default: {
        guest: {
            findFirst: mockFindFirst,
        },
    },
}));

import { findDuplicateGuest, normalizePhone } from "@/lib/guest-utils";

describe("normalizePhone", () => {
    it("returns null for null input", () => {
        expect(normalizePhone(null)).toBeNull();
    });

    it("returns null for undefined input", () => {
        expect(normalizePhone(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
        expect(normalizePhone("")).toBeNull();
    });

    it("returns null when cleaned string is shorter than 3 chars", () => {
        expect(normalizePhone("12")).toBeNull();
    });

    it("keeps explicit international + format", () => {
        expect(normalizePhone("+41 79 123 45 67")).toBe("+41791234567");
    });

    it("keeps explicit + format with punctuation", () => {
        expect(normalizePhone("+(41)-79(123)45-67")).toBe("+41791234567");
    });

    it("keeps + and strips non-digit characters", () => {
        expect(normalizePhone("+41 79abc 45")).toBe("+417945");
    });

    it("converts 00 international prefix to +", () => {
        expect(normalizePhone("0041 79 123 45 67")).toBe("+41791234567");
    });

    it("converts non-Swiss 00 international prefix", () => {
        expect(normalizePhone("0033 1 23 45 67 89")).toBe("+33123456789");
    });

    it("converts local swiss mobile with leading zero", () => {
        expect(normalizePhone("079 123 45 67")).toBe("+41791234567");
    });

    it("converts local swiss landline with leading zero", () => {
        expect(normalizePhone("021 345 67 89")).toBe("+41213456789");
    });

    it("converts local number with mixed separators", () => {
        expect(normalizePhone("0(79)-123 45 67")).toBe("+41791234567");
    });

    it("adds + when number already starts with 41 and is long enough", () => {
        expect(normalizePhone("41796261271")).toBe("+41796261271");
    });

    it("treats a local number without leading zero as swiss", () => {
        expect(normalizePhone("796261271")).toBe("+41796261271");
    });

    it("treats short 41-prefixed numbers as local-missing-zero fallback", () => {
        expect(normalizePhone("4199")).toBe("+414199");
    });

    it("handles 41-prefixed number with spaces and no plus", () => {
        expect(normalizePhone("41 79 123 45 67")).toBe("+41791234567");
    });

    it("converts explicit 00 with punctuation", () => {
        expect(normalizePhone("00(41) 79-123")).toBe("+4179123");
    });
});

describe("findDuplicateGuest", () => {
    beforeEach(() => {
        mockFindFirst.mockReset();
    });

    it("queries by event and all match conditions when email and phone are present", async () => {
        const guest = { id: "guest-1" };
        mockFindFirst.mockResolvedValueOnce(guest);

        const result = await findDuplicateGuest("event-1", {
            firstName: " Alice ",
            lastName: " Example ",
            email: " Alice@Example.com ",
            phone: "079 123 45 67",
        });

        expect(result).toBe(guest);
        expect(mockFindFirst).toHaveBeenCalledTimes(1);
        expect(mockFindFirst).toHaveBeenCalledWith({
            where: {
                eventId: "event-1",
                OR: [
                    { email: { equals: "alice@example.com", mode: "insensitive" } },
                    { phone: "+41791234567" },
                    {
                        AND: [
                            { firstName: { equals: "alice", mode: "insensitive" } },
                            { lastName: { equals: "example", mode: "insensitive" } },
                        ],
                    },
                ],
            },
        });
    });

    it("omits email condition when email is missing", async () => {
        mockFindFirst.mockResolvedValueOnce(null);

        await findDuplicateGuest("event-1", {
            firstName: "Alice",
            lastName: "Example",
            phone: "0791234567",
        });

        expect(mockFindFirst).toHaveBeenCalledWith({
            where: {
                eventId: "event-1",
                OR: [
                    { phone: "+41791234567" },
                    {
                        AND: [
                            { firstName: { equals: "alice", mode: "insensitive" } },
                            { lastName: { equals: "example", mode: "insensitive" } },
                        ],
                    },
                ],
            },
        });
    });

    it("omits phone condition when phone is missing", async () => {
        mockFindFirst.mockResolvedValueOnce(null);

        await findDuplicateGuest("event-2", {
            firstName: "Alice",
            lastName: "Example",
            email: "alice@example.com",
        });

        expect(mockFindFirst).toHaveBeenCalledWith({
            where: {
                eventId: "event-2",
                OR: [
                    { email: { equals: "alice@example.com", mode: "insensitive" } },
                    {
                        AND: [
                            { firstName: { equals: "alice", mode: "insensitive" } },
                            { lastName: { equals: "example", mode: "insensitive" } },
                        ],
                    },
                ],
            },
        });
    });

    it("falls back to name-only match when email/phone are empty", async () => {
        mockFindFirst.mockResolvedValueOnce(null);

        await findDuplicateGuest("event-3", {
            firstName: "Bob",
            lastName: "Builder",
            email: "   ",
            phone: "  ",
        });

        expect(mockFindFirst).toHaveBeenCalledWith({
            where: {
                eventId: "event-3",
                OR: [
                    {
                        AND: [
                            { firstName: { equals: "bob", mode: "insensitive" } },
                            { lastName: { equals: "builder", mode: "insensitive" } },
                        ],
                    },
                ],
            },
        });
    });

    it("uses normalized international 00 phone in query", async () => {
        mockFindFirst.mockResolvedValueOnce(null);

        await findDuplicateGuest("event-4", {
            firstName: "Alice",
            lastName: "Example",
            phone: "0041 79 123 45 67",
        });

        expect(mockFindFirst).toHaveBeenCalledWith({
            where: {
                eventId: "event-4",
                OR: [
                    { phone: "+41791234567" },
                    {
                        AND: [
                            { firstName: { equals: "alice", mode: "insensitive" } },
                            { lastName: { equals: "example", mode: "insensitive" } },
                        ],
                    },
                ],
            },
        });
    });

    it("trims and lowercases names before matching", async () => {
        mockFindFirst.mockResolvedValueOnce(null);

        await findDuplicateGuest("event-5", {
            firstName: "  Élodie  ",
            lastName: "  DuPont ",
        });

        expect(mockFindFirst).toHaveBeenCalledWith({
            where: {
                eventId: "event-5",
                OR: [
                    {
                        AND: [
                            { firstName: { equals: "élodie", mode: "insensitive" } },
                            { lastName: { equals: "dupont", mode: "insensitive" } },
                        ],
                    },
                ],
            },
        });
    });

    it("returns null when prisma returns no duplicate", async () => {
        mockFindFirst.mockResolvedValueOnce(null);

        const result = await findDuplicateGuest("event-6", {
            firstName: "John",
            lastName: "Doe",
            email: "john@doe.com",
            phone: "021 345 67 89",
        });

        expect(result).toBeNull();
    });

    it("returns the duplicate guest when prisma finds one", async () => {
        const duplicate = { id: "duplicate-1", firstName: "John", lastName: "Doe" };
        mockFindFirst.mockResolvedValueOnce(duplicate);

        const result = await findDuplicateGuest("event-7", {
            firstName: "john",
            lastName: "doe",
            email: "JOHN@DOE.COM",
            phone: "41791234567",
        });

        expect(result).toEqual(duplicate);
    });
});
