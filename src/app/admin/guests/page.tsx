import prisma from '@/lib/prisma';
import Link from 'next/link';
import { RsvpStatus } from '@prisma/client';

const PAGE_SIZE = 25;

type GuestsSearchParams = {
    q?: string;
    eventId?: string;
    rsvpStatus?: string;
    page?: string;
};

function toPositiveInt(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? '', 10);
    if (Number.isNaN(parsed) || parsed < 1) {
        return fallback;
    }
    return parsed;
}

export default async function AdminGuestsPage({
    searchParams,
}: {
    searchParams: Promise<GuestsSearchParams>;
}) {
    const params = await searchParams;
    const q = (params.q ?? '').trim();
    const eventId = params.eventId ?? '';
    const rsvpStatusParam = params.rsvpStatus ?? '';
    const page = toPositiveInt(params.page, 1);
    const selectedRsvpStatus = Object.values(RsvpStatus).includes(
        rsvpStatusParam as RsvpStatus,
    )
        ? (rsvpStatusParam as RsvpStatus)
        : undefined;

    const where = {
        ...(q
            ? {
                OR: [
                    { firstName: { contains: q, mode: 'insensitive' as const } },
                    { lastName: { contains: q, mode: 'insensitive' as const } },
                    { email: { contains: q, mode: 'insensitive' as const } },
                ],
            }
            : {}),
        ...(eventId ? { eventId } : {}),
        ...(selectedRsvpStatus ? { rsvpStatus: selectedRsvpStatus } : {}),
    };

    const [events, totalGuests, guests] = await Promise.all([
        prisma.event.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true },
        }),
        prisma.guest.count({ where }),
        prisma.guest.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                plusOnesCount: true,
                rsvpStatus: true,
                event: {
                    select: {
                        name: true,
                    },
                },
                promoter: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                checkIn: {
                    select: {
                        id: true,
                    },
                },
            },
        }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalGuests / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);

    const makeHref = (nextPage: number) => {
        const query = new URLSearchParams();
        if (q) query.set('q', q);
        if (eventId) query.set('eventId', eventId);
        if (selectedRsvpStatus) query.set('rsvpStatus', selectedRsvpStatus);
        if (nextPage > 1) query.set('page', String(nextPage));
        const suffix = query.toString();
        return suffix ? `/admin/guests?${suffix}` : '/admin/guests';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Guests</h1>
                <p className="mt-2 text-sm text-gray-400">
                    Cross-event guest directory with promoter and check-in status.
                </p>
            </div>

            <form className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                        type="search"
                        name="q"
                        defaultValue={q}
                        placeholder="Search name or email"
                        className="rounded-md border-gray-700 bg-gray-800 text-white p-2 text-sm"
                    />
                    <select
                        name="eventId"
                        defaultValue={eventId}
                        className="rounded-md border-gray-700 bg-gray-800 text-white p-2 text-sm"
                    >
                        <option value="">All events</option>
                        {events.map((event) => (
                            <option key={event.id} value={event.id}>
                                {event.name}
                            </option>
                        ))}
                    </select>
                    <select
                        name="rsvpStatus"
                        defaultValue={selectedRsvpStatus ?? ''}
                        className="rounded-md border-gray-700 bg-gray-800 text-white p-2 text-sm"
                    >
                        <option value="">All RSVP statuses</option>
                        {Object.values(RsvpStatus).map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            Filter
                        </button>
                        <Link
                            href="/admin/guests"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium border border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                            Clear
                        </Link>
                    </div>
                </div>
            </form>

            <div className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-800">
                        <thead className="bg-gray-950">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Event</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Promoter</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Plus-Ones</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">RSVP</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Checked In</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {guests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">
                                        No guests found.
                                    </td>
                                </tr>
                            ) : guests.map((guest) => (
                                <tr key={guest.id} className="hover:bg-gray-800/40">
                                    <td className="px-4 py-4 text-sm font-medium text-white">
                                        <Link href={`/admin/guests/${guest.id}`} className="text-indigo-400 hover:text-indigo-300">
                                            {guest.firstName} {guest.lastName}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-300">{guest.email || '-'}</td>
                                    <td className="px-4 py-4 text-sm text-gray-300">{guest.event.name}</td>
                                    <td className="px-4 py-4 text-sm text-gray-300">{guest.promoter?.name || guest.promoter?.email || '-'}</td>
                                    <td className="px-4 py-4 text-sm text-gray-300">{guest.plusOnesCount}</td>
                                    <td className="px-4 py-4 text-sm text-gray-300">{guest.rsvpStatus}</td>
                                    <td className="px-4 py-4 text-sm text-gray-300">{guest.checkIn ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between border-t border-gray-800 px-4 py-3 text-sm text-gray-400">
                    <span>
                        Showing page {currentPage} of {totalPages} ({totalGuests} guests)
                    </span>
                    <div className="flex items-center gap-2">
                        <Link
                            href={makeHref(Math.max(1, currentPage - 1))}
                            className={`px-3 py-1 rounded border ${currentPage <= 1 ? 'pointer-events-none border-gray-800 text-gray-600' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
                        >
                            Previous
                        </Link>
                        <Link
                            href={makeHref(Math.min(totalPages, currentPage + 1))}
                            className={`px-3 py-1 rounded border ${currentPage >= totalPages ? 'pointer-events-none border-gray-800 text-gray-600' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}`}
                        >
                            Next
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
