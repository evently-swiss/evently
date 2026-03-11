import prisma from '@/lib/prisma';
import { NewEventForm } from './form';



async function getStaff() {
    const doorStaff = await prisma.user.findMany({
        where: { role: 'ENTRY_STAFF' },
        orderBy: { name: 'asc' },
    });
    const promoters = await prisma.user.findMany({
        where: { role: 'PROMOTER' },
        orderBy: { name: 'asc' },
    });
    return { doorStaff, promoters };
}

export default async function NewEventPage() {
    const { doorStaff, promoters } = await getStaff();

    return <NewEventForm doorStaff={doorStaff} promoters={promoters} />;
}
