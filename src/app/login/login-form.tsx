'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { authenticate } from '@/lib/actions';

type LoginFormProps = {
  emailVerified: boolean;
  passwordReset: boolean;
};

export default function LoginForm({ emailVerified, passwordReset }: LoginFormProps) {
  const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight">Sign in to your account</h2>
        </div>
        {emailVerified && (
          <div className="rounded-md border border-emerald-700 bg-emerald-950/60 px-4 py-3 text-sm text-emerald-200">
            Email verified - you can now log in.
          </div>
        )}
        {passwordReset && (
          <div className="rounded-md border border-emerald-700 bg-emerald-950/60 px-4 py-3 text-sm text-emerald-200">
            Password updated. You can now sign in with your new password.
          </div>
        )}
        <form action={dispatch} className="mt-8 space-y-6">
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-t-md border-0 bg-gray-900 px-3 py-3 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-b-md border-0 bg-gray-900 px-3 py-3 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <div className="mb-3 text-right">
              <Link href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300">
                Forgot your password?
              </Link>
            </div>
            <button
              type="submit"
              aria-disabled={isPending}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
