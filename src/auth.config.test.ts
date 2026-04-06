import { authConfig } from "@/auth.config";

function makeRequest(pathname: string): Request {
    return new Request(`https://evently.local${pathname}`, {
        headers: {
            cookie: "next-auth.session-token=test",
        },
    });
}

describe("authConfig.callbacks.authorized", () => {
    it("allows unauthenticated access to /events", async () => {
        const result = await authConfig.callbacks.authorized({
            auth: null,
            request: {
                nextUrl: new URL("https://evently.local/events"),
            },
        } as never);

        expect(result).toBe(true);
    });

    it("blocks unauthenticated access to /admin", async () => {
        const result = await authConfig.callbacks.authorized({
            auth: null,
            request: {
                nextUrl: new URL("https://evently.local/admin"),
            },
        } as never);

        expect(result).toBe(false);
    });

    it("redirects subscribed super admin from /login to /admin/dashboard", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ hasAccess: true }), { status: 200 }),
        );

        const result = await authConfig.callbacks.authorized({
            auth: { user: { role: "SUPER_ADMIN" } },
            request: {
                nextUrl: new URL("https://evently.local/login"),
                url: "https://evently.local/login",
                headers: new Headers({ cookie: "next-auth.session-token=test" }),
            },
        } as never);

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).headers.get("location")).toBe("https://evently.local/admin/dashboard");
    });

    it("redirects unsubscribed super admin away from /admin", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ hasAccess: false }), { status: 200 }),
        );

        const request = makeRequest("/admin/events");
        const result = await authConfig.callbacks.authorized({
            auth: { user: { role: "SUPER_ADMIN" } },
            request: {
                nextUrl: new URL(request.url),
                url: request.url,
                headers: request.headers,
            },
        } as never);

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).headers.get("location")).toBe("https://evently.local/pricing?upgrade=1");
    });

    it("allows unsubscribed super admin to stay on /pricing", async () => {
        vi.spyOn(globalThis, "fetch").mockResolvedValue(
            new Response(JSON.stringify({ hasAccess: false }), { status: 200 }),
        );

        const request = makeRequest("/pricing");
        const result = await authConfig.callbacks.authorized({
            auth: { user: { role: "SUPER_ADMIN" } },
            request: {
                nextUrl: new URL(request.url),
                url: request.url,
                headers: request.headers,
            },
        } as never);

        expect(result).toBe(true);
    });
});
