import { vi } from "vitest";

export const mockAuthSession = (role: "SUPER_ADMIN" | "PROMOTER" | "ENTRY_STAFF" = "SUPER_ADMIN") => ({
    user: {
        id: "test-user-id",
        email: "test@example.com",
        role,
    },
});

export const createAuthModuleMock = () => ({
    auth: vi.fn().mockResolvedValue(mockAuthSession()),
    signIn: vi.fn(),
    signOut: vi.fn(),
    handlers: { GET: vi.fn(), POST: vi.fn() },
});
