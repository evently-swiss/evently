'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // 1. Determine role before signing in to set correct redirect
    let redirectPath = '/login';
    try {
        const { getUser } = await import('@/lib/auth');
        const user = await getUser(email);
        if (user) {
            switch (user.role) {
                case 'ADMIN':
                    redirectPath = '/admin';
                    break;
                case 'PROMOTER':
                    redirectPath = '/promoter';
                    break;
                case 'ENTRY_STAFF':
                    redirectPath = '/door';
                    break;
            }
        }
    } catch (error) {
        console.error('Error fetching user for redirect:', error);
        // Fallback to default redirect if user fetch fails (signIn will handle auth failure)
    }

    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: redirectPath,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}
