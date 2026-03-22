'use server';

import { signIn } from '@/lib/auth';
import { AuthError, CredentialsSignin } from 'next-auth';

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
                case 'SUPER_ADMIN':
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
        if (error instanceof CredentialsSignin && error.code === 'email_not_verified') {
            return 'Your email is not verified. Please check your inbox for the verification link.';
        }

        if (error instanceof AuthError) {
            if (error.type === 'CredentialsSignin') {
                return 'Invalid credentials';
            }
            return 'Something went wrong.';
        }
        throw error;
    }
}
