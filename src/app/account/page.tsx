import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = session.user as { name?: string; email?: string; role?: string };

  return (
    <div className="min-h-screen bg-black text-white py-12">
      <div className="max-w-lg mx-auto px-4 space-y-8">
        <h1 className="text-2xl font-bold">Account</h1>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Profile</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Name</span>
            <span className="text-sm text-white">{user.name ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Email</span>
            <span className="text-sm text-white">{user.email ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Role</span>
            <span className="text-sm text-white capitalize">{user.role?.toLowerCase() ?? '—'}</span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Subscription</h2>
          <Link
            href="/account/billing"
            className="block w-full text-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Manage Billing
          </Link>
        </div>
      </div>
    </div>
  );
}
