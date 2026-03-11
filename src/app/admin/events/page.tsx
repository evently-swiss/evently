import prisma from '@/lib/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';



async function getEvents(showArchived: boolean) {
    return await prisma.event.findMany({
        where: showArchived ? { status: 'ARCHIVED' } : { status: { not: 'ARCHIVED' } },
        orderBy: { date: 'desc' },
        include: {
            _count: {
                select: { guests: true },
            },
            guests: {
                select: { plusOnesCount: true },
            },
        },
    });
}

async function getArchivedCount() {
    return await prisma.event.count({ where: { status: 'ARCHIVED' } });
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
    const { archived } = await searchParams;
    const showArchived = archived === '1';

    const [events, archivedCount] = await Promise.all([
        getEvents(showArchived),
        showArchived ? Promise.resolve(0) : getArchivedCount(),
    ]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold">Events</h1>
                <div className="flex items-center gap-3">
                    {showArchived ? (
                        <Link
                            href="/admin/events"
                            className="text-sm text-gray-400 hover:text-gray-300"
                        >
                            ← Hide archived
                        </Link>
                    ) : archivedCount > 0 ? (
                        <Link
                            href="/admin/events?archived=1"
                            className="text-sm text-gray-400 hover:text-gray-300"
                        >
                            Show archived ({archivedCount})
                        </Link>
                    ) : null}
                    {!showArchived && (
                        <Link
                            href="/admin/events/new"
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Create Event
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md border border-gray-800">
                <ul role="list" className="divide-y divide-gray-800">
                    {events.length === 0 ? (
                        <li className="px-4 py-4 sm:px-6 text-center text-gray-400">
                            {showArchived ? 'No archived events.' : 'No events found. Create one to get started.'}
                        </li>
                    ) : (
                        events.map((event) => (
                            <li key={event.id}>
                                {showArchived ? (
                                    <Link href={`/admin/events/${event.id}`} className="block hover:bg-gray-800/50 transition duration-150 ease-in-out opacity-60">
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-start justify-between flex-col sm:flex-row gap-2">
                                                <p className="text-sm font-medium text-gray-400 truncate">{event.name}</p>
                                                <div className="flex-shrink-0">
                                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-800 text-gray-400">
                                                        ARCHIVED
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex flex-col sm:flex-row sm:justify-between gap-2">
                                                <div>
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        {format(new Date(event.date), 'dd.MM.yyyy')}
                                                        {event.startTime && ` • ${event.startTime}`}
                                                    </p>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <p>
                                                        {event._count.guests + (event.guests?.reduce((sum, g) => sum + g.plusOnesCount, 0) || 0)} Guests
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    <Link href={`/admin/events/${event.id}`} className="block hover:bg-gray-800 transition duration-150 ease-in-out">
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-start justify-between flex-col sm:flex-row gap-2">
                                                <p className="text-sm font-medium text-indigo-400 truncate">{event.name}</p>
                                                <div className="flex-shrink-0">
                                                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${event.status === 'PUBLISHED' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                                                        }`}>
                                                        {event.status}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex flex-col sm:flex-row sm:justify-between gap-2">
                                                <div>
                                                    <p className="flex items-center text-sm text-gray-400">
                                                        {format(new Date(event.date), 'dd.MM.yyyy')}
                                                        {event.startTime && ` • ${event.startTime}`}
                                                    </p>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-400">
                                                    <p>
                                                        {event._count.guests + (event.guests?.reduce((sum, g) => sum + g.plusOnesCount, 0) || 0)} Guests
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
