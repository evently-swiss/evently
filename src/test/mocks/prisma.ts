import { vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn>;

type PrismaModelMock = {
    [key: string]: MockFn;
};

type PrismaClientMock = {
    user: PrismaModelMock;
    guest: PrismaModelMock;
    event: PrismaModelMock;
};

export const createPrismaMock = (): PrismaClientMock => ({
    user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    guest: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    event: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
});
