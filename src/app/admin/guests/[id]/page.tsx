import prisma from '@/lib/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';

async function getGuest(id: string) {
    const guest = await prisma.guest.findUnique({
        where: { id },
        include: {
            event: {
                select: {
                    id: true,
                    name: true,
                    date: true,
                },
            },
            promoter: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            signupLink: {
                select: {
                    id: true,
                    slug: true,
                    title: true,
                },
            },
            checkIn: {
                select: {
                    checkedInAt: true,
                    checkedInBy: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            },
        },
    });

    if (!guest) {
        notFound();
    }

    return guest;
}

function displayDateTime(value: Date | null | undefined) {
    if (!value) return '-';
    return format(new Date(value), 'dd.MM.yyyy HH:mm');
}

export default async function GuestDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const guest = await getGuest(id);

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold">Guest Detail</h1>
                <Link href="/admin/guests" className="text-sm text-gray-400 hover:text-gray-300">
                    ← Back to guests
                </Link>
            </div>

            <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <dt className="text-gray-400">Full Name</dt>
                        <dd className="mt-1 text-white">{guest.firstName} {guest.lastName}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Email</dt>
                        <dd className="mt-1 text-white">{guest.email || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Phone</dt>
                        <dd className="mt-1 text-white">{guest.phone || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">RSVP Status</dt>
                        <dd className="mt-1 text-white">{guest.rsvpStatus}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Plus-Ones</dt>
                        <dd className="mt-1 text-white">{guest.plusOnesCount}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Checked In</dt>
                        <dd className="mt-1 text-white">{guest.checkIn ? 'Yes' : 'No'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Created At</dt>
                        <dd className="mt-1 text-white">{displayDateTime(guest.createdAt)}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Updated At</dt>
                        <dd className="mt-1 text-white">{displayDateTime(guest.updatedAt)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-gray-400">Note</dt>
                        <dd className="mt-1 text-white whitespace-pre-wrap">{guest.note || '-'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-gray-400">Event</dt>
                        <dd className="mt-1 text-white">
                            <Link href={`/admin/events/${guest.event.id}`} className="text-indigo-400 hover:text-indigo-300">
                                {guest.event.name}
                            </Link>{' '}
                            <span className="text-gray-400">({format(new Date(guest.event.date), 'dd.MM.yyyy')})</span>
                        </dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-gray-400">Promoter</dt>
                        <dd className="mt-1 text-white">{guest.promoter?.name || guest.promoter?.email || '-'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-gray-400">Signup Link</dt>
                        <dd className="mt-1 text-white">
                            {guest.signupLink
                                ? `${guest.signupLink.title || guest.signupLink.slug} (${guest.signupLink.slug})`
                                : '-'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Invite Token</dt>
                        <dd className="mt-1 text-white break-all">{guest.inviteToken || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">QR Token</dt>
                        <dd className="mt-1 text-white break-all">{guest.qrToken || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Invited At</dt>
                        <dd className="mt-1 text-white">{displayDateTime(guest.invitedAt)}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Checked-In At</dt>
                        <dd className="mt-1 text-white">{displayDateTime(guest.checkIn?.checkedInAt)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-gray-400">Checked-In By</dt>
                        <dd className="mt-1 text-white">
                            {guest.checkIn
                                ? guest.checkIn.checkedInBy.name || guest.checkIn.checkedInBy.email
                                : '-'}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
