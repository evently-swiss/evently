import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { LinkModal } from '@/components/modals/LinkModal';
import { createPromoterLink, updatePromoterLink, deletePromoterLink, addGuest, updateGuest, deleteGuest } from './actions';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { AddGuestModal } from '@/components/modals/AddGuestModal';
import { EditGuestModal } from '@/components/modals/EditGuestModal';
import { ImportGuestsModal } from '@/components/modals/ImportGuestsModal';



async function getPromoterEvent(id: string, userId: string, role: string) {
    if (role === 'ADMIN') {
        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                signupLinks: {
                    include: {
                        _count: { select: { guests: true } },
                        guests: {
                            select: { plusOnesCount: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                },
                guests: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        checkIn: true
                    }
                }
            },
        });

        if (!event) notFound();
        return event;
    }

    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            signupLinks: {
                where: { assignedPromoters: { some: { id: userId } } },
                include: {
                    _count: { select: { guests: true } },
                    guests: {
                        select: { plusOnesCount: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
            },
            guests: {
                where: {
                    OR: [
                        { promoterId: userId },
                        { signupLink: { assignedPromoters: { some: { id: userId } } } }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    checkIn: true
                }
            }
        },
    });

    if (!event) notFound();

    // Security check: User must be creator OR have links assigned
    const isCreator = event.createdByUserId === userId;
    const hasLinks = event.signupLinks.length > 0;

    if (!isCreator && !hasLinks) {
        notFound();
    }

    return event;
}

export default async function PromoterEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return null;
    const { id } = await params;
    const event = await getPromoterEvent(id, session.user.id, session.user.role);

    const totalGuests = event.guests.length + event.guests.reduce((acc, g) => acc + g.plusOnesCount, 0);
    const checkedIn = event.guests.filter(g => g.checkIn && !g.checkIn.checkedOutAt).length +
        event.guests.filter(g => g.checkIn && !g.checkIn.checkedOutAt).reduce((sum, g) => sum + g.plusOnesCount, 0);
    const checkInRate = totalGuests > 0 ? Math.round((checkedIn / totalGuests) * 100) : 0;

    return (
        <div>
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-7 text-white">
                        {event.name}
                    </h2>
                    <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-x-6">
                        <div className="flex items-center text-sm text-gray-400">
                            📅 {format(new Date(event.date), 'dd.MM.yyyy')}{event.startTime && ` • ${event.startTime}`}
                        </div>
                        {event.venueName && (
                            <div className="flex items-center text-sm text-gray-400">
                                📍 {event.venueName}
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex gap-3">
                        <div className="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3 text-center min-w-[72px]">
                            <div className="text-xl font-bold text-white">{totalGuests}</div>
                            <div className="text-xs text-gray-400 mt-0.5">My Guests</div>
                        </div>
                        <div className="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3 text-center min-w-[72px]">
                            <div className="text-xl font-bold text-green-400">{checkedIn}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Checked In</div>
                        </div>
                        <div className="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3 text-center min-w-[72px]">
                            <div className="text-xl font-bold text-indigo-400">{checkInRate}%</div>
                            <div className="text-xs text-gray-400 mt-0.5">Rate</div>
                        </div>
                    </div>
                </div>
                {event.createdByUserId === session.user.id && (
                    <div className="flex">
                        <Link
                            href={`/promoter/events/${event.id}/edit`}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Edit Event
                        </Link>
                    </div>
                )}
            </div>

            <div className="mt-6 sm:mt-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                    <h3 className="text-lg font-medium leading-6 text-white">My Links</h3>
                    <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                        <a
                            href={`/promoter/events/${event.id}/export`}
                            className="inline-flex items-center justify-center px-3 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Export CSV
                        </a>
                        <ImportGuestsModal eventId={event.id} />
                        <LinkModal mode="create" eventId={event.id} userRole="PROMOTER" createAction={createPromoterLink} />
                        <AddGuestModal eventId={event.id} addGuestAction={addGuest} />
                    </div>
                </div>

                <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md border border-gray-800 mb-8">
                    <ul role="list" className="divide-y divide-gray-800">
                        {event.signupLinks.length === 0 ? (
                            <li className="px-4 py-4 sm:px-6 text-center text-gray-400">
                                No links yet. Create one to start promoting.
                            </li>
                        ) : (
                            event.signupLinks.map((link) => (
                                <li key={link.id} className="px-4 py-4 sm:px-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-sm font-medium text-indigo-400 truncate">
                                                {link.title || link.slug}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                /s/{link.slug} • {link.type}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                                            {!link.active ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900 text-red-200">
                                                    Inactive
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-200">
                                                    Active
                                                </span>
                                            )}
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-800 text-gray-300">
                                                {link.guests?.length + (link.guests?.reduce((acc, g) => acc + g.plusOnesCount, 0) || 0)} / {link.maxTotalGuests || '∞'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <LinkModal mode="edit" eventId={event.id} link={link} userRole="PROMOTER" updateAction={updatePromoterLink} deleteAction={deletePromoterLink} />
                                                <CopyLinkButton slug={link.slug} />
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                <h3 className="text-lg font-medium leading-6 text-white mb-4">My Guest List</h3>
                <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md border border-gray-800">
                    <ul role="list" className="divide-y divide-gray-800">
                        {event.guests.length === 0 ? (
                            <li className="px-4 py-4 sm:px-6 text-center text-gray-400">
                                No guests signed up yet.
                            </li>
                        ) : (
                            event.guests.map((guest) => (
                                <li key={guest.id} className="px-4 py-4 sm:px-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-white">
                                                {guest.firstName} {guest.lastName}
                                                {guest.plusOnesCount > 0 && <span className="text-gray-400 ml-1">+{guest.plusOnesCount}</span>}
                                            </p>
                                            {guest.note && <p className="text-xs text-gray-500 truncate">{guest.note}</p>}
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-3">
                                            {guest.checkIn ? (
                                                !guest.checkIn.checkedOutAt ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-300">
                                                        Checked In
                                                    </span>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900 text-yellow-300">
                                                        Checked Out
                                                    </span>
                                                )
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                                                    Not Arrived
                                                </span>
                                            )}
                                            <EditGuestModal eventId={event.id} guest={guest} updateAction={updateGuest} deleteAction={deleteGuest} />
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
