import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import GuestList from './guest-list';
import { notFound } from 'next/navigation';



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

export default async function DoorCheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;
    const event = await getEventData(eventId);

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
            <GuestList guests={sortedGuests} eventId={event.id} />
        </div>
    );
}
