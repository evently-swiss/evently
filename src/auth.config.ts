import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async authorized({ auth, request }) {
            const { nextUrl } = request;
            const isLoggedIn = !!auth?.user;
            const role = (auth?.user as { role?: string } | undefined)?.role;
            const isSuperAdmin = role === 'SUPER_ADMIN';
            const isOnDashboard = nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/promoter') ||
                nextUrl.pathname.startsWith('/door');
            const isPublicAuthSurface = nextUrl.pathname === '/' ||
                nextUrl.pathname === '/login' ||
                nextUrl.pathname.startsWith('/events');

            if (isOnDashboard) {
                if (!isLoggedIn) {
                    return false; // Redirect unauthenticated users to login page
                }

                if (isSuperAdmin && nextUrl.pathname.startsWith('/admin')) {
                    const hasOperatorSubscription = await checkOperatorSubscription(request);
                    if (!hasOperatorSubscription) {
                        return Response.redirect(new URL('/pricing?upgrade=1', nextUrl));
                    }
                }

                return true;
            } else if (isLoggedIn && nextUrl.pathname === '/login') {
                // Redirect logged-in users away from login page to their dashboard
                if (isSuperAdmin) {
                    const hasOperatorSubscription = await checkOperatorSubscription(request);
                    if (hasOperatorSubscription) {
                        return Response.redirect(new URL('/admin/dashboard', nextUrl));
                    }
                    return Response.redirect(new URL('/pricing?upgrade=1', nextUrl));
                } else if (role === 'PROMOTER') {
                    return Response.redirect(new URL('/promoter', nextUrl));
                } else if (role === 'ENTRY_STAFF') {
                    return Response.redirect(new URL('/door', nextUrl));
                }
            } else if (isLoggedIn && isSuperAdmin) {
                const hasOperatorSubscription = await checkOperatorSubscription(request);

                if (isPublicAuthSurface && hasOperatorSubscription) {
                    return Response.redirect(new URL('/admin/dashboard', nextUrl));
                }

                if (isPublicAuthSurface && !hasOperatorSubscription && nextUrl.pathname !== '/pricing') {
                    return Response.redirect(new URL('/pricing?upgrade=1', nextUrl));
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role?: string }).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;

async function checkOperatorSubscription(request: Request): Promise<boolean> {
    try {
        const subscriptionCheckUrl = new URL('/api/internal/operator-subscription', request.url);
        const cookieHeader = request.headers.get('cookie');

        const response = await fetch(subscriptionCheckUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        });

        if (!response.ok) {
            return false;
        }

        const data = (await response.json()) as { hasAccess?: boolean };
        return data.hasAccess === true;
    } catch (error) {
        console.error('Subscription check failed:', error);
        return false;
    }
}
