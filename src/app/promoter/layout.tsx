import Link from 'next/link';
import { signOut, auth } from '@/lib/auth';
import { PromoterNav } from '@/components/PromoterNav';

export default async function PromoterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <div className="min-h-screen bg-black text-white">
            <PromoterNav session={session} />
            <main className="py-6 sm:py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
            </main>
        </div>
    );
}

