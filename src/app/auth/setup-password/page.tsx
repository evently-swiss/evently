'use client';

import { useActionState } from 'react';
import { setupPassword } from './actions';
import Link from 'next/link';
import { use } from 'react';

type SetupPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default function SetupPasswordPage({ searchParams }: SetupPasswordPageProps) {
  const { token } = use(searchParams);
  const [state, dispatch] = useActionState(setupPassword.bind(null, token ?? ''), null);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
        <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
          <h1 className="text-2xl font-bold">Invalid link</h1>
          <p className="mt-3 text-sm text-gray-300">
            This setup link is invalid or has expired.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
        <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
          <h1 className="text-2xl font-bold text-green-400">Password set!</h1>
          <p className="mt-3 text-sm text-gray-300">
            Your password has been saved. You can now sign in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-8">
        <h1 className="text-2xl font-bold">Set your password</h1>
        <p className="mt-2 text-sm text-gray-400">
          Choose a password to activate your Evently account.
        </p>

        <form action={dispatch} className="mt-6 space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              required
              minLength={8}
              className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              placeholder="At least 8 characters"
            />
            {state?.errors?.password && (
              <p className="text-red-500 text-sm mt-1">{state.errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400">
              Confirm password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              required
              className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
            {state?.errors?.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{state.errors.confirmPassword}</p>
            )}
          </div>

          {state?.message && (
            <p className="text-red-500 text-sm">{state.message}</p>
          )}

          <button
            type="submit"
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Set password
          </button>
        </form>
      </div>
    </div>
  );
}
