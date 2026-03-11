import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { EditEventForm } from './edit-form';



async function getEvent(id: string, userId: string) {
    const event = await prisma.event.findUnique({
        where: { id },
    });

    if (!event) notFound();

    // Security: Only allow editing if user is the creator
    if (event.createdByUserId !== userId) {
        redirect(`/promoter/events/${id}`);
    }

    return event;
}

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || (session.user.role !== 'PROMOTER' && session.user.role !== 'ADMIN')) {
        redirect('/login');
    }

    const { id } = await params;
    const event = await getEvent(id, session.user.id);

    return (
        <div className="max-w-2xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
                        Edit Event
                    </h2>
                </div>
            </div>

            <EditEventForm event={event} />
        </div>
    );
}
