import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRevalidatePath } = vi.hoisted(() => ({
    mockRevalidatePath: vi.fn(),
}));

const { mockAuth } = vi.hoisted(() => ({
    mockAuth: vi.fn(),
}));

const { mockGuestFindUnique, mockCheckInFindUnique, mockCheckInCreate, mockCheckInUpdate } = vi.hoisted(() => ({
    mockGuestFindUnique: vi.fn(),
    mockCheckInFindUnique: vi.fn(),
    mockCheckInCreate: vi.fn(),
    mockCheckInUpdate: vi.fn(),
}));

vi.mock("next/cache", () => ({
    revalidatePath: mockRevalidatePath,
}));

vi.mock("@/lib/auth", () => ({
    auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
    default: {
        guest: {
            findUnique: mockGuestFindUnique,
        },
        checkIn: {
            findUnique: mockCheckInFindUnique,
            create: mockCheckInCreate,
            update: mockCheckInUpdate,
        },
    },
}));

import { checkInByToken } from "@/app/door/[eventId]/actions";

function mockSession(role: "SUPER_ADMIN" | "ENTRY_STAFF" | "PROMOTER" = "ENTRY_STAFF") {
    return {
        user: {
            id: "user-1",
            role,
        },
    };
}

describe("checkInByToken integration", () => {
    beforeEach(() => {
        mockRevalidatePath.mockReset();
        mockAuth.mockReset();
        mockGuestFindUnique.mockReset();
        mockCheckInFindUnique.mockReset();
        mockCheckInCreate.mockReset();
        mockCheckInUpdate.mockReset();

        mockAuth.mockResolvedValue(mockSession());
    });

    it("rejects unauthorized users", async () => {
        mockAuth.mockResolvedValueOnce(null);

        const result = await checkInByToken("token-1", "event-1");

        expect(result).toEqual({ message: "Unauthorized", success: false });
        expect(mockGuestFindUnique).not.toHaveBeenCalled();
        expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("rejects invalid empty token values", async () => {
        const result = await checkInByToken("   ", "event-1");

        expect(result).toEqual({ message: "Invalid QR token", success: false });
        expect(mockGuestFindUnique).not.toHaveBeenCalled();
    });

    it("rejects tokens that do not map to a guest", async () => {
        mockGuestFindUnique.mockResolvedValueOnce(null);

        const result = await checkInByToken("missing-token", "event-1");

        expect(result).toEqual({ message: "Invalid QR token", success: false });
        expect(mockCheckInFindUnique).not.toHaveBeenCalled();
    });

    it("rejects tokens for another event", async () => {
        mockGuestFindUnique.mockResolvedValueOnce({
            id: "guest-1",
            eventId: "event-other",
            firstName: "Alice",
            lastName: "Example",
        });

        const result = await checkInByToken("guest-token", "event-1");

        expect(result).toEqual({
            message: "This QR code is for a different event",
            success: false,
        });
        expect(mockCheckInFindUnique).not.toHaveBeenCalled();
    });

    it("returns a clear message when guest is already checked in", async () => {
        mockGuestFindUnique.mockResolvedValueOnce({
            id: "guest-1",
            eventId: "event-1",
            firstName: "Alice",
            lastName: "Example",
        });
        mockCheckInFindUnique.mockResolvedValueOnce({
            guestId: "guest-1",
            checkedOutAt: null,
        });

        const result = await checkInByToken("guest-token", "event-1");

        expect(result).toEqual({
            message: "Alice Example is already checked in",
            success: false,
        });
        expect(mockCheckInCreate).not.toHaveBeenCalled();
        expect(mockCheckInUpdate).not.toHaveBeenCalled();
        expect(mockRevalidatePath).not.toHaveBeenCalled();
    });

    it("creates a check-in and revalidates the door page on success", async () => {
        mockGuestFindUnique.mockResolvedValueOnce({
            id: "guest-1",
            eventId: "event-1",
            firstName: "Alice",
            lastName: "Example",
        });
        mockCheckInFindUnique.mockResolvedValueOnce(null);
        mockCheckInCreate.mockResolvedValueOnce({
            guestId: "guest-1",
        });

        const result = await checkInByToken(" guest-token ", "event-1");

        expect(mockGuestFindUnique).toHaveBeenCalledWith({
            where: { qrToken: "guest-token" },
            select: {
                id: true,
                eventId: true,
                firstName: true,
                lastName: true,
            },
        });
        expect(mockCheckInCreate).toHaveBeenCalledWith({
            data: {
                guestId: "guest-1",
                checkedInByUserId: "user-1",
                checkedInCount: 1,
            },
        });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/door/event-1");
        expect(result).toEqual({
            message: "Checked in Alice Example",
            success: true,
        });
    });

    it("re-checks in guest who had checked out previously", async () => {
        mockGuestFindUnique.mockResolvedValueOnce({
            id: "guest-1",
            eventId: "event-1",
            firstName: "Alice",
            lastName: "Example",
        });
        mockCheckInFindUnique.mockResolvedValueOnce({
            guestId: "guest-1",
            checkedOutAt: new Date("2026-01-01T10:00:00.000Z"),
        });
        mockCheckInUpdate.mockResolvedValueOnce({
            guestId: "guest-1",
        });

        const result = await checkInByToken("guest-token", "event-1");

        expect(mockCheckInUpdate).toHaveBeenCalledTimes(1);
        expect(mockCheckInUpdate).toHaveBeenCalledWith({
            where: { guestId: "guest-1" },
            data: expect.objectContaining({
                checkedOutAt: null,
                checkedOutCount: null,
                checkedInByUserId: "user-1",
                checkedInCount: 1,
            }),
        });
        expect(mockCheckInCreate).not.toHaveBeenCalled();
        expect(mockRevalidatePath).toHaveBeenCalledWith("/door/event-1");
        expect(result).toEqual({
            message: "Checked in Alice Example",
            success: true,
        });
    });

    it("returns a failure message when database operations throw", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
        mockGuestFindUnique.mockRejectedValueOnce(new Error("db down"));

        const result = await checkInByToken("guest-token", "event-1");

        expect(result).toEqual({
            message: "Failed to check in guest by QR code.",
            success: false,
        });
        expect(mockRevalidatePath).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});
