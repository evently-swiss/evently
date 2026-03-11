'use client';

import { useActionState } from 'react';
import { createUser } from '../actions';
import Link from 'next/link';
import { Select } from '@/components/ui/Select';
import { ActionState } from '@/lib/definitions';

export default function NewUserPage() {
    const [state, dispatch] = useActionState<ActionState, FormData>(createUser, null);

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Create New User</h2>

            <form action={dispatch} className="space-y-6 bg-gray-900 p-8 rounded-lg border border-gray-800">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-400">Name</label>
                    <input type="text" name="name" id="name" required className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                    {state?.errors?.name && <p className="text-red-500 text-sm mt-1">{state.errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-400">Email</label>
                    <input type="email" name="email" id="email" required className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                    {state?.errors?.email && <p className="text-red-500 text-sm mt-1">{state.errors.email}</p>}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-400">Password</label>
                    <input type="password" name="password" id="password" required className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                    {state?.errors?.password && <p className="text-red-500 text-sm mt-1">{state.errors.password}</p>}
                </div>

                <div>
                    <Select label="Role" name="role" id="role">
                        <option value="PROMOTER">Promoter</option>
                        <option value="ENTRY_STAFF">Entry Staff</option>
                        <option value="ADMIN">Admin</option>
                    </Select>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Link
                        href="/admin/users"
                        className="px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Create User
                    </button>
                </div>
                {state?.message && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
            </form>
        </div>
    );
}
