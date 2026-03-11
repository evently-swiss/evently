import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/promoter') ||
                nextUrl.pathname.startsWith('/door');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && nextUrl.pathname === '/login') {
                // Redirect logged-in users away from login page to their dashboard
                const role = (auth.user as any).role;
                if (role === 'ADMIN') {
                    return Response.redirect(new URL('/admin', nextUrl));
                } else if (role === 'PROMOTER') {
                    return Response.redirect(new URL('/promoter', nextUrl));
                } else if (role === 'ENTRY_STAFF') {
                    return Response.redirect(new URL('/door', nextUrl));
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
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
