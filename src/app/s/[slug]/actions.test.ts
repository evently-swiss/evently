import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRedirect } = vi.hoisted(() => ({
    mockRedirect: vi.fn((url: string) => {
        throw new Error(`NEXT_REDIRECT:${url}`);
    }),
}));

const { mockSignupLinkFindUnique, mockGuestFindFirst, mockGuestCreate } = vi.hoisted(() => ({
    mockSignupLinkFindUnique: vi.fn(),
    mockGuestFindFirst: vi.fn(),
    mockGuestCreate: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    redirect: mockRedirect,
}));

vi.mock("@/lib/prisma", () => ({
    default: {
        signupLink: {
            findUnique: mockSignupLinkFindUnique,
        },
        guest: {
            findFirst: mockGuestFindFirst,
            create: mockGuestCreate,
        },
    },
}));

import { signupGuest } from "@/app/s/[slug]/actions";

function buildLink(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        id: "link-1",
        slug: "summer-party",
        eventId: "event-1",
        active: true,
        maxTotalGuests: 100,
        maxPlusOnesPerSignup: 3,
        singleUse: false,
        emailMode: "OPTIONAL",
        phoneMode: "OPTIONAL",
        allowNotes: true,
        _count: { guests: 2 },
        event: {
            id: "event-1",
            name: "Summer Party",
            status: "PUBLISHED",
            capacity: 500,
            _count: { guests: 10 },
        },
        ...overrides,
    };
}

function buildFormData(values: Record<string, string>) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
        formData.set(key, value);
    }
    return formData;
}

describe("signupGuest integration", () => {
    beforeEach(() => {
        mockRedirect.mockClear();
        mockSignupLinkFindUnique.mockReset();
        mockGuestFindFirst.mockReset();
        mockGuestCreate.mockReset();
    });

    it("creates a guest on the happy path", async () => {
        mockSignupLinkFindUnique.mockResolvedValueOnce(buildLink());
        mockGuestFindFirst.mockResolvedValueOnce(null);
        mockGuestCreate.mockResolvedValueOnce({ qrToken: "qr-happy" });

        const formData = buildFormData({
            firstName: "Alice",
            lastName: "Example",
            email: "alice@example.com",
            phone: "079 123 45 67",
            plusOnes: "1",
            note: "See you there",
        });

        await expect(signupGuest("summer-party", null, formData)).rejects.toThrow(
            "NEXT_REDIRECT:/s/summer-party/confirmation?token=qr-happy",
        );

        expect(mockGuestFindFirst).toHaveBeenCalledWith({
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

        expect(mockGuestCreate).toHaveBeenCalledTimes(1);
        expect(mockGuestCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    firstName: "Alice",
                    lastName: "Example",
                    email: "alice@example.com",
                    phone: "+41791234567",
                    plusOnesCount: 1,
                    signupLinkId: "link-1",
                    eventId: "event-1",
                }),
                select: { qrToken: true },
            }),
        );
    });

    it("rejects duplicate guests by name/phone/email matching", async () => {
        mockSignupLinkFindUnique.mockResolvedValueOnce(buildLink());
        mockGuestFindFirst.mockResolvedValueOnce({ id: "existing-guest" });

        const formData = buildFormData({
            firstName: "Alice",
            lastName: "Example",
            phone: "0791234567",
            email: "alice@example.com",
            plusOnes: "0",
        });

        const result = await signupGuest("summer-party", null, formData);

        expect(result).toEqual({
            message: "You are already on the guestlist for Summer Party.",
        });
        expect(mockGuestCreate).not.toHaveBeenCalled();
    });

    it("rejects signup when link quota is exceeded", async () => {
        mockSignupLinkFindUnique.mockResolvedValueOnce(
            buildLink({
                maxTotalGuests: 2,
                _count: { guests: 2 },
            }),
        );

        const formData = buildFormData({
            firstName: "Alice",
            lastName: "Example",
            plusOnes: "0",
        });

        const result = await signupGuest("summer-party", null, formData);

        expect(result).toEqual({ message: "This guestlist is full." });
        expect(mockGuestFindFirst).not.toHaveBeenCalled();
        expect(mockGuestCreate).not.toHaveBeenCalled();
    });

    it("rejects signup when link is inactive", async () => {
        mockSignupLinkFindUnique.mockResolvedValueOnce(
            buildLink({
                active: false,
            }),
        );

        const formData = buildFormData({
            firstName: "Alice",
            lastName: "Example",
            plusOnes: "0",
        });

        const result = await signupGuest("summer-party", null, formData);

        expect(result).toEqual({ message: "This signup link is invalid or expired." });
        expect(mockGuestCreate).not.toHaveBeenCalled();
    });

    it("enforces required fields by mode", async () => {
        mockSignupLinkFindUnique.mockResolvedValueOnce(
            buildLink({
                phoneMode: "REQUIRED",
                emailMode: "OPTIONAL",
            }),
        );

        const formData = buildFormData({
            firstName: "Alice",
            lastName: "Example",
            phone: "",
            plusOnes: "0",
        });

        const result = await signupGuest("summer-party", null, formData);

        expect(result).toEqual({
            errors: {
                phone: ["Phone is required"],
            },
        });
        expect(mockGuestCreate).not.toHaveBeenCalled();
    });

    it("rejects hidden fields when they are submitted", async () => {
        mockSignupLinkFindUnique.mockResolvedValueOnce(
            buildLink({
                emailMode: "HIDDEN",
                phoneMode: "HIDDEN",
            }),
        );

        const formData = buildFormData({
            firstName: "Alice",
            lastName: "Example",
            email: "alice@example.com",
            phone: "0791234567",
            plusOnes: "0",
        });

        const result = await signupGuest("summer-party", null, formData);

        expect(result).toEqual({
            message: "This signup link does not accept email or phone values.",
        });
        expect(mockGuestFindFirst).not.toHaveBeenCalled();
        expect(mockGuestCreate).not.toHaveBeenCalled();
    });
});
