import prisma from '@/lib/prisma';
import { LinkType, FieldMode } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { CloudDownload, Tags, User as UserIcon, Link as LinkIcon, Hand } from 'lucide-react';
import { LinkModal } from '@/components/modals/LinkModal';
import { createLink, updateLink, deleteLink, archiveEvent, unarchiveEvent } from './actions';
import { ArchiveEventButton } from './ArchiveEventButton';
import { UnarchiveEventButton } from './UnarchiveEventButton';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { EditGuestModal } from '@/components/modals/EditGuestModal';
import { ImportGuestsModal } from '@/components/modals/ImportGuestsModal';
import { updateGuest, deleteGuest, addGuest } from '@/app/promoter/events/[id]/actions';
import { GuestNote } from '@/components/GuestNote';
import { AddGuestModal } from '@/components/modals/AddGuestModal';

async function getEvent(id: string) {
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            signupLinks: {
                include: {
                    _count: { select: { guests: true } },
                    guests: { select: { plusOnesCount: true } },
                    assignedPromoters: true,
                },
                orderBy: { createdAt: 'desc' },
            },
            guests: {
                orderBy: { createdAt: 'desc' },
                include: {
                    checkIn: true,
                    signupLink: true,
                    promoter: true,
                }
            },
            _count: { select: { guests: true } },
        },
    });
    if (!event) notFound();
    return event;
}

async function getPromoters() {
    return await prisma.user.findMany({
        where: { role: 'PROMOTER' },
    });
}

function ViaBadge({ guest }: { guest: any }) {
    if (guest.signupLink) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-900 text-indigo-200 border border-indigo-700/50 truncate max-w-[150px]">
                <LinkIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                {guest.signupLink.title || guest.signupLink.slug}
            </span>
        );
    }
    if (guest.promoter) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900 text-purple-200 border border-purple-700/50 truncate max-w-[150px]">
                <UserIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                {guest.promoter.name || 'Promoter'}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700 truncate">
            <Hand className="w-3 h-3 mr-1 flex-shrink-0" />
            Manual
        </span>
    );
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await getEvent(id);
    const promoters = await getPromoters();

    const totalGuests = event._count.guests + (event.guests?.reduce((sum, g) => sum + g.plusOnesCount, 0) || 0);
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
                        <div className="flex items-center text-sm text-gray-400">
                            Status: {event.status}
                        </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <div className="bg-gray-900 rounded-lg border border-gray-800 px-4 py-3 text-center min-w-[72px]">
                            <div className="text-xl font-bold text-white">{totalGuests}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Guests</div>
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
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href={`/admin/events/${event.id}/edit`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Edit Event
                    </Link>
                    <a
                        href={`/admin/events/${event.id}/export`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <CloudDownload className="w-4 h-4 mr-2" />
                        Export CSV
                    </a>
                    <ImportGuestsModal eventId={event.id} />
                    <AddGuestModal eventId={event.id} addGuestAction={addGuest} />
                    {event.status !== 'ARCHIVED' ? (
                        <ArchiveEventButton archiveAction={archiveEvent.bind(null, event.id)} />
                    ) : (
                        <UnarchiveEventButton unarchiveAction={unarchiveEvent.bind(null, event.id)} />
                    )}
                </div>
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium leading-6 text-white">Signup Links</h3>
                    <LinkModal mode="create" eventId={event.id} promoters={promoters} userRole="ADMIN" createAction={createLink} />
                </div>

                <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md border border-gray-800">
                    <ul role="list" className="divide-y divide-gray-800">
                        {event.signupLinks.length === 0 ? (
                            <li className="px-4 py-4 sm:px-6 text-center text-gray-400">
                                No signup links yet.
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
                                                {(link._count.guests + (link.guests?.reduce((sum, g) => sum + g.plusOnesCount, 0) || 0))} / {link.maxTotalGuests || '∞'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <LinkModal mode="edit" eventId={event.id} link={link} promoters={promoters} userRole="ADMIN" updateAction={updateLink} deleteAction={deleteLink} />
                                                <CopyLinkButton slug={link.slug} />
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-medium leading-6 text-white mb-4">All Guests</h3>
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
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="text-sm font-medium text-white">
                                                {guest.firstName} {guest.lastName}
                                                {guest.plusOnesCount > 0 && <span className="text-gray-400 ml-1">+{guest.plusOnesCount}</span>}
                                            </p>
                                            <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                                                <GuestNote note={guest.note} />
                                                <ViaBadge guest={guest} />
                                            </div>
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
