import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Trash } from 'lucide-react';
import { deleteUser } from './actions';



async function getUsers() {
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Users</h1>
                <Link
                    href="/admin/users/new"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Create User
                </Link>
            </div>

            <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md border border-gray-800">
                <ul role="list" className="divide-y divide-gray-800">
                    {users.map((user) => (
                        <li key={user.id} className="px-4 py-4 sm:px-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex flex-col min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{user.name || 'No Name'}</p>
                                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-3 sm:space-x-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-900 text-red-300' :
                                        user.role === 'PROMOTER' ? 'bg-blue-900 text-blue-300' :
                                            'bg-indigo-900 text-indigo-300'
                                        }`}>
                                        {user.role}
                                    </span>
                                    <form action={deleteUser.bind(null, user.id)}>
                                        <button type="submit" className="text-gray-400 hover:text-red-500">
                                            <Trash className="h-5 w-5" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
