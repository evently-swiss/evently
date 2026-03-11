import Link from 'next/link';
import { signOut, auth } from '@/lib/auth';
import { LogOut } from 'lucide-react';
import { ViewSwitcher } from '@/components/ViewSwitcher';

export default async function DoorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    return (
        <div className="min-h-screen bg-black text-white">
            <nav className="border-b border-gray-800 bg-gray-900 p-4">
                <div className="flex justify-between items-center max-w-md mx-auto">
                    <Link href="/door" className="text-lg font-bold text-indigo-500">
                        Door Access
                    </Link>
                    <div className="flex items-center">
                        <ViewSwitcher userRole={session?.user?.role || ''} />
                        <form
                            action={async () => {
                                'use server';
                                await signOut();
                            }}
                        >
                            <button
                                type="submit"
                                className="p-2 text-gray-400 hover:text-white focus:outline-none"
                            >
                                <LogOut className="h-6 w-6" />
                            </button>
                        </form>
                    </div>
                </div>
            </nav>
            <main className="max-w-md mx-auto p-4">{children}</main>
        </div>
    );
}
