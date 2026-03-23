'use client';

import { useActionState } from 'react';
import { resetPassword } from './actions';
import { ActionState } from '@/lib/definitions';

type ResetPasswordFormProps = {
  token: string;
};

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, dispatch, isPending] = useActionState<ActionState, FormData>(resetPassword, null);

  return (
    <form action={dispatch} className="space-y-4 rounded-lg border border-gray-800 bg-gray-900 p-6">
      <input type="hidden" name="token" value={token} />

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          New Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="mt-1 block w-full rounded-md border-0 bg-gray-800 px-3 py-2 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500"
        />
        {state?.errors?.password && <p className="mt-1 text-sm text-red-500">{state.errors.password[0]}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
          Confirm New Password
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
        {isPending ? 'Resetting password...' : 'Reset password'}
      </button>
    </form>
  );
}
