import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import {
    calcAttendanceStats,
    calcCheckInVelocity,
    calcLinkBreakdown,
    calcPromoterBreakdown,
} from '@/lib/analytics';

async function getEventAnalyticsData(id: string) {
    const event = await prisma.event.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            date: true,
            capacity: true,
            signupLinks: {
                select: { id: true, title: true, slug: true, type: true },
                orderBy: { createdAt: 'asc' },
            },
            guests: {
                select: {
                    id: true,
                    plusOnesCount: true,
                    signupLinkId: true,
                    promoterId: true,
                    promoter: { select: { id: true, name: true } },
                    checkIn: { select: { checkedInAt: true } },
                },
            },
        },
    });

    if (!event) notFound();

    const guests = event.guests.map((g) => ({
        id: g.id,
        plusOnesCount: g.plusOnesCount,
        signupLinkId: g.signupLinkId,
        promoterId: g.promoterId,
        checkIn: g.checkIn ? { checkedInAt: g.checkIn.checkedInAt } : null,
    }));

    const promoters = Array.from(
        new Map(
            event.guests
                .filter((g) => g.promoter)
                .map((g) => [g.promoter!.id, g.promoter!]),
        ).values(),
    );

    const attendance = calcAttendanceStats(guests, event.capacity);
    const velocity = calcCheckInVelocity(guests);
    const linkBreakdown = calcLinkBreakdown(guests, event.signupLinks);
    const promoterBreakdown = calcPromoterBreakdown(guests, promoters);

    return { event, attendance, velocity, linkBreakdown, promoterBreakdown };
}

function StatCard({
    label,
    value,
    sub,
    color = 'text-white',
}: {
    label: string;
    value: string | number;
    sub?: string;
    color?: string;
}) {
    return (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <p className="text-xs uppercase tracking-wide text-indigo-300">{label}</p>
            <p className={`mt-3 text-3xl font-semibold ${color}`}>{value}</p>
            {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
    );
}

function formatHour(hour: number) {
    const suffix = hour < 12 ? 'AM' : 'PM';
    const h = hour % 12 || 12;
    return `${h}:00 ${suffix}`;
}

export default async function EventAnalyticsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { event, attendance, velocity, linkBreakdown, promoterBreakdown } =
        await getEventAnalyticsData(id);

    const maxVelocity = velocity.reduce((m, v) => Math.max(m, v.count), 0);

    return (
        <div className="space-y-8">
            {/* Header / breadcrumb */}
            <div>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <Link href={`/admin/events/${event.id}`} className="hover:text-indigo-400">
                        {event.name}
                    </Link>
                    <span>/</span>
                    <span className="text-white">Analytics</span>
                </div>
                <h1 className="text-2xl font-bold">Event Analytics</h1>
                <p className="mt-1 text-sm text-gray-400">
                    {format(new Date(event.date), 'dd.MM.yyyy')}
                </p>
            </div>

            {/* Tab links */}
            <div className="flex gap-4 border-b border-gray-800 pb-0 -mb-4">
                <Link
                    href={`/admin/events/${event.id}`}
                    className="pb-3 text-sm text-gray-400 hover:text-white border-b-2 border-transparent"
                >
                    Overview
                </Link>
                <span className="pb-3 text-sm text-white border-b-2 border-indigo-500">
                    Analytics
                </span>
            </div>

            {/* Attendance stats */}
            <section>
                <h2 className="text-lg font-semibold mb-4">Attendance</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                    <StatCard label="Total Guests" value={attendance.totalHeads} />
                    <StatCard
                        label="Checked In"
                        value={attendance.checkedInHeads}
                        color="text-green-400"
                    />
                    <StatCard
                        label="No-shows"
                        value={attendance.noShowHeads}
                        color="text-red-400"
                    />
                    <StatCard
                        label="Attendance Rate"
                        value={`${attendance.attendanceRate}%`}
                        color="text-indigo-400"
                    />
                    {attendance.capacityUtilization !== null ? (
                        <StatCard
                            label="Capacity"
                            value={`${attendance.capacityUtilization}%`}
                            sub={`of ${event.capacity} max`}
                            color={
                                attendance.capacityUtilization >= 90
                                    ? 'text-red-400'
                                    : 'text-yellow-400'
                            }
                        />
                    ) : (
                        <StatCard label="Plus-ones" value={attendance.totalPlusOnes} />
                    )}
                </div>
            </section>

            {/* Check-in velocity */}
            <section>
                <h2 className="text-lg font-semibold mb-4">Check-in Velocity</h2>
                {velocity.length === 0 ? (
                    <p className="text-sm text-gray-400">No check-ins recorded yet.</p>
                ) : (
                    <div className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-950">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 w-28">
                                        Hour
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Check-ins
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 w-16 text-right">
                                        Count
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {velocity.map(({ hour, count }) => {
                                    const barPct =
                                        maxVelocity > 0
                                            ? Math.round((count / maxVelocity) * 100)
                                            : 0;
                                    return (
                                        <tr key={hour} className="hover:bg-gray-800/40">
                                            <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                                                {formatHour(hour)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="w-full bg-gray-800 rounded-full h-2">
                                                    <div
                                                        className="bg-indigo-500 h-2 rounded-full"
                                                        style={{ width: `${barPct}%` }}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-200 text-right">
                                                {count}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Signup link breakdown */}
            <section>
                <h2 className="text-lg font-semibold mb-4">Signup Link Performance</h2>
                {linkBreakdown.length === 0 ? (
                    <p className="text-sm text-gray-400">No signup links for this event.</p>
                ) : (
                    <div className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-950">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Link
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Guests
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Checked In
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {linkBreakdown.map((link) => (
                                    <tr key={link.linkId} className="hover:bg-gray-800/40">
                                        <td className="px-4 py-3 text-sm text-white">
                                            {link.title || link.slug}
                                            <span className="ml-1 text-xs text-gray-500">
                                                /{link.slug}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">
                                            {link.type}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-200 text-right">
                                            {link.totalHeads}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-green-400 text-right">
                                            {link.checkedInHeads}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-indigo-400 text-right font-medium">
                                            {link.checkInRate}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Promoter breakdown */}
            {promoterBreakdown.length > 0 && (
                <section>
                    <h2 className="text-lg font-semibold mb-4">Promoter Performance</h2>
                    <div className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-gray-950">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Promoter
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Guests
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Checked In
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        Conversion
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {promoterBreakdown.map((p) => (
                                    <tr key={p.promoterId} className="hover:bg-gray-800/40">
                                        <td className="px-4 py-3 text-sm text-white">
                                            {p.name || 'Unnamed'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-200 text-right">
                                            {p.totalHeads}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-green-400 text-right">
                                            {p.checkedInHeads}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-indigo-400 text-right font-medium">
                                            {p.conversionRate}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Plus-ones summary */}
            {attendance.totalPlusOnes > 0 && (
                <section>
                    <h2 className="text-lg font-semibold mb-3">Plus-ones</h2>
                    <div className="rounded-lg border border-gray-800 bg-gray-900 p-5 flex gap-8">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-indigo-300">
                                Total Plus-ones
                            </p>
                            <p className="mt-2 text-2xl font-semibold">{attendance.totalPlusOnes}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-indigo-300">
                                Share of Total
                            </p>
                            <p className="mt-2 text-2xl font-semibold">
                                {attendance.totalHeads > 0
                                    ? Math.round(
                                          (attendance.totalPlusOnes / attendance.totalHeads) * 100,
                                      )
                                    : 0}
                                %
                            </p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
