import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import GuestList from './guest-list';
import LoungeList from './lounge-list';
import { notFound } from 'next/navigation';
import Link from 'next/link';



async function getEventData(id: string) {
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            guests: {
                include: {
                    checkIn: true,
                },
                orderBy: { createdAt: 'desc' }, // Or alphabetical?
            },
            loungeReservations: {
                where: { status: { in: ['CONFIRMED', 'ARRIVED'] } },
                orderBy: [{ arrivalTime: 'asc' }, { createdAt: 'desc' }],
            },
        },
    });
    if (!event) notFound();
    return event;
}

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }): Promise<Metadata> {
    const { eventId } = await params;
    const event = await getEventData(eventId);
    return {
        title: `${event.name} - Door View`,
    };
}

export default async function DoorCheckInPage({
    params,
    searchParams,
}: {
    params: Promise<{ eventId: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const { eventId } = await params;
    const { tab } = await searchParams;
    const event = await getEventData(eventId);
    const selectedTab = tab === 'lounge' ? 'lounge' : 'guestlist';

    // Sort guests alphabetically by default for easier searching if not filtering
    const sortedGuests = event.guests.sort((a, b) =>
        a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName)
    );

    return (
        <div>
            <div className="mb-4">
                <h1 className="text-xl font-bold truncate">{event.name}</h1>
                <p className="text-gray-400 text-sm">
                    {event.guests.length + event.guests.reduce((acc, g) => acc + g.plusOnesCount, 0)} Guests • {event.guests.filter(g => g.checkIn && !g.checkIn.checkedOutAt).length + event.guests.filter(g => g.checkIn && !g.checkIn.checkedOutAt).reduce((acc, g) => acc + g.plusOnesCount, 0)} Checked In
                </p>
            </div>
            <div className="mb-4 rounded-xl border border-gray-800 bg-gray-900 p-1 grid grid-cols-2 gap-1">
                <Link
                    href={`/door/${event.id}`}
                    className={`rounded-lg px-3 py-2 text-center text-sm font-medium ${
                        selectedTab === 'guestlist' ? 'bg-indigo-600 text-white' : 'text-gray-300'
                    }`}
                >
                    Guest List
                </Link>
                <Link
                    href={`/door/${event.id}?tab=lounge`}
                    className={`rounded-lg px-3 py-2 text-center text-sm font-medium ${
                        selectedTab === 'lounge' ? 'bg-indigo-600 text-white' : 'text-gray-300'
                    }`}
                >
                    Lounge
                </Link>
            </div>

            {selectedTab === 'guestlist' ? (
                <GuestList guests={sortedGuests} eventId={event.id} />
            ) : (
                <LoungeList eventId={event.id} reservations={event.loungeReservations} />
            )}
        </div>
    );
}
