'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Role } from '@prisma/client';
import { Select } from '@/components/ui/Select';
import { ActionState } from '@/lib/definitions';
import { updateUser } from '../../actions';

type EditableUser = {
    id: string;
    name: string | null;
    email: string;
    role: Role;
};

export function EditUserForm({ user }: { user: EditableUser }) {
    const updateUserWithId = updateUser.bind(null, user.id);
    const [state, dispatch] = useActionState<ActionState, FormData>(updateUserWithId, null);

    return (
        <form action={dispatch} className="space-y-6 bg-gray-900 p-8 rounded-lg border border-gray-800">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-400">Name</label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    defaultValue={user.name ?? ''}
                    className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
                {state?.errors?.name && <p className="text-red-500 text-sm mt-1">{state.errors.name}</p>}
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400">Email</label>
                <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    defaultValue={user.email}
                    className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                />
                {state?.errors?.email && <p className="text-red-500 text-sm mt-1">{state.errors.email}</p>}
            </div>

            <div>
                {user.role === 'SUPER_ADMIN' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Role</label>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900 text-indigo-200">
                                SUPER_ADMIN
                            </span>
                            <span className="text-sm text-gray-500">This role cannot be changed here.</span>
                        </div>
                        <input type="hidden" name="role" value="ADMIN" />
                    </div>
                ) : (
                    <Select label="Role" name="role" id="role" defaultValue={user.role}>
                        <option value="PROMOTER">Promoter</option>
                        <option value="ENTRY_STAFF">Entry Staff</option>
                        <option value="ADMIN">Admin</option>
                    </Select>
                )}
                {state?.errors?.role && <p className="text-red-500 text-sm mt-1">{state.errors.role}</p>}
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
                    Save Changes
                </button>
            </div>
            {state?.message && <p className="text-red-500 text-sm mt-2">{state.message}</p>}
        </form>
    );
}
