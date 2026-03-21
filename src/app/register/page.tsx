'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { registerUser } from './actions';
import { ActionState } from '@/lib/definitions';

export default function RegisterPage() {
  const [state, dispatch, isPending] = useActionState<ActionState, FormData>(registerUser, null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
        </div>

        <form action={dispatch} className="space-y-4 rounded-lg border border-gray-800 bg-gray-900 p-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-md border-0 bg-gray-800 px-3 py-2 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
            />
            {state?.errors?.name && <p className="mt-1 text-sm text-red-500">{state.errors.name[0]}</p>}
          </div>

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              className="mt-1 block w-full rounded-md border-0 bg-gray-800 px-3 py-2 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
            />
            {state?.errors?.password && (
              <p className="mt-1 text-sm text-red-500">{state.errors.password[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              className="mt-1 block w-full rounded-md border-0 bg-gray-800 px-3 py-2 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
            />
            {state?.errors?.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{state.errors.confirmPassword[0]}</p>
            )}
          </div>

          {state?.message && <p className="text-sm text-red-500">{state.message}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
