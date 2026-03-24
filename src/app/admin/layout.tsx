import { auth } from '@/lib/auth';
import { AdminNav } from '@/components/AdminNav';
import { hasActiveSubscription } from '@/lib/subscription';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const role = (session?.user as { role?: string } | undefined)?.role;

    // SUPER_ADMIN is exempt from the subscription gate (platform owner)
    if (session?.user?.id && role !== 'SUPER_ADMIN') {
        const active = await hasActiveSubscription(session.user.id);
        if (!active) {
            redirect('/pricing');
        }
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <AdminNav session={session} />
            <main className="py-6 sm:py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
            </main>
        </div>
    );
}
