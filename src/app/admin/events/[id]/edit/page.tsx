import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EditEventForm } from './edit-form';



async function getEvent(id: string) {
    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            doorStaff: true,
            assignedPromoters: true,
        },
    });
    if (!event) notFound();
    return event;
}

async function getDoorStaff() {
    return await prisma.user.findMany({
        where: { role: 'ENTRY_STAFF' },
        orderBy: { name: 'asc' },
    });
}

async function getPromoters() {
    return await prisma.user.findMany({
        where: { role: 'PROMOTER' },
        orderBy: { name: 'asc' },
    });
}

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await getEvent(id);
    const doorStaff = await getDoorStaff();
    const promoters = await getPromoters();

    return (
        <div className="max-w-2xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-white sm:text-3xl sm:truncate">
                        Edit Event
                    </h2>
                </div>
            </div>

            <EditEventForm event={event} doorStaff={doorStaff} promoters={promoters} />
        </div>
    );
}
