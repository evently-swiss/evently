'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { requestPasswordReset } from './actions';
import { ActionState } from '@/lib/definitions';

export default function ForgotPasswordPage() {
  const [state, dispatch, isPending] = useActionState<ActionState, FormData>(requestPasswordReset, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="mt-2 text-sm text-gray-400">
            Enter your account email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form action={dispatch} className="space-y-4 rounded-lg border border-gray-800 bg-gray-900 p-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border-0 bg-gray-800 px-3 py-2 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
            />
            {state?.errors?.email && <p className="mt-1 text-sm text-red-500">{state.errors.email[0]}</p>}
          </div>

          {state?.message && (
            <p className={`text-sm ${state.success ? 'text-emerald-400' : 'text-red-500'}`}>{state.message}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Sending reset link...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Remembered your password?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
