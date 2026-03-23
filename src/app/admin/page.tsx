import prisma from '@/lib/prisma';
import Link from 'next/link';
import { format } from 'date-fns';

type RecentUser = {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: Date;
    mustChangePassword: boolean;
    emailVerified: Date | null;
    verificationToken: string | null;
};

type ActiveEvent = {
    id: string;
    name: string;
    date: Date;
    startTime: string | null;
    totalGuests: number;
    checkedInGuests: number;
};

async function getDashboardData() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
        totalUsers,
        totalEvents,
        guestTotals,
        checkInsToday,
        recentUsers,
        publishedEvents,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.event.count(),
        prisma.guest.aggregate({
            _count: { _all: true },
            _sum: { plusOnesCount: true },
        }),
        prisma.checkIn.count({
            where: { checkedInAt: { gte: startOfToday } },
        }),
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                mustChangePassword: true,
                emailVerified: true,
                verificationToken: true,
            },
        }),
        prisma.event.findMany({
            where: { status: 'PUBLISHED' },
            orderBy: { date: 'asc' },
            select: {
                id: true,
                name: true,
                date: true,
                startTime: true,
                _count: { select: { guests: true } },
                guests: {
                    select: {
                        plusOnesCount: true,
                        checkIn: { select: { id: true } },
                    },
                },
            },
        }),
    ]);

    const totalGuests =
        guestTotals._count._all + (guestTotals._sum.plusOnesCount ?? 0);

    const activeEvents: ActiveEvent[] = publishedEvents.map((event) => {
        const plusOnes = event.guests.reduce((sum, guest) => sum + guest.plusOnesCount, 0);
        const checkedInGuests = event.guests.reduce((sum, guest) => {
            return guest.checkIn ? sum + 1 : sum;
        }, 0);

        return {
            id: event.id,
            name: event.name,
            date: event.date,
            startTime: event.startTime,
            totalGuests: event._count.guests + plusOnes,
            checkedInGuests,
        };
    });

    return {
        stats: {
            totalUsers,
            totalEvents,
            totalGuests,
            checkInsToday,
        },
        recentUsers: recentUsers as RecentUser[],
        activeEvents,
    };
}

function roleBadgeClasses(role: string) {
    if (role === 'SUPER_ADMIN') {
        return 'bg-red-950 text-red-200';
    }
    if (role === 'ADMIN') {
        return 'bg-red-900 text-red-300';
    }
    if (role === 'PROMOTER') {
        return 'bg-blue-900 text-blue-300';
    }
    return 'bg-indigo-900 text-indigo-300';
}

export default async function AdminPage() {
    const { stats, recentUsers, activeEvents } = await getDashboardData();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
                <p className="mt-2 text-sm text-gray-400">
                    Platform overview across users, events, guests, and check-ins.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-lg border border-indigo-900/60 bg-gray-900 p-5">
                    <p className="text-xs uppercase tracking-wide text-indigo-300">Total Users</p>
                    <p className="mt-3 text-3xl font-semibold">{stats.totalUsers}</p>
                </div>
                <div className="rounded-lg border border-indigo-900/60 bg-gray-900 p-5">
                    <p className="text-xs uppercase tracking-wide text-indigo-300">Total Events</p>
                    <p className="mt-3 text-3xl font-semibold">{stats.totalEvents}</p>
                </div>
                <div className="rounded-lg border border-indigo-900/60 bg-gray-900 p-5">
                    <p className="text-xs uppercase tracking-wide text-indigo-300">Total Guests</p>
                    <p className="mt-3 text-3xl font-semibold">{stats.totalGuests}</p>
                </div>
                <div className="rounded-lg border border-indigo-900/60 bg-gray-900 p-5">
                    <p className="text-xs uppercase tracking-wide text-indigo-300">Check-ins Today</p>
                    <p className="mt-3 text-3xl font-semibold">{stats.checkInsToday}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <section className="xl:col-span-3 rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
                    <div className="border-b border-gray-800 px-4 py-3 sm:px-6">
                        <h2 className="text-lg font-semibold">Recent Registrations</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-950">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Email</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Created</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {recentUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">
                                            No users registered yet.
                                        </td>
                                    </tr>
                                ) : recentUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-800/40">
                                        <td className="px-4 py-4 text-sm font-medium text-white">{user.name || 'No Name'}</td>
                                        <td className="px-4 py-4 text-sm text-gray-300">{user.email}</td>
                                        <td className="px-4 py-4 text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleBadgeClasses(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-300">
                                            {format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm')}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            {user.mustChangePassword ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900/60 text-yellow-300">Invite Pending</span>
                                            ) : user.verificationToken && !user.emailVerified ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-900/60 text-orange-300">Email Unverified</span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/60 text-green-300">Active</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="xl:col-span-2 rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
                    <div className="border-b border-gray-800 px-4 py-3 sm:px-6">
                        <h2 className="text-lg font-semibold">Active Events</h2>
                    </div>
                    <ul className="divide-y divide-gray-800">
                        {activeEvents.length === 0 ? (
                            <li className="px-4 py-6 text-sm text-gray-400">No published events.</li>
                        ) : activeEvents.map((event) => (
                            <li key={event.id} className="px-4 py-4 hover:bg-gray-800/40">
                                <Link href={`/admin/events/${event.id}`} className="block">
                                    <p className="text-sm font-medium text-indigo-400">{event.name}</p>
                                    <p className="mt-1 text-sm text-gray-300">
                                        {format(new Date(event.date), 'dd.MM.yyyy')}
                                        {event.startTime ? ` • ${event.startTime}` : ''}
                                    </p>
                                    <p className="mt-2 text-xs text-gray-400">
                                        Guests: <span className="text-gray-200">{event.totalGuests}</span> • Check-ins: <span className="text-gray-200">{event.checkedInGuests}</span>
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}
