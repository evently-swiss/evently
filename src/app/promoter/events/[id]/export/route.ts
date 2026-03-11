import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';



export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || (session.user.role !== 'PROMOTER' && session.user.role !== 'ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const { id } = await params;

    // Only export guests from THEIR links
    const guests = await prisma.guest.findMany({
        where: {
            eventId: id,
            OR: [
                { promoterId: session.user.id },
                { signupLink: { assignedPromoters: { some: { id: session.user.id } } } }
            ]
        },
        include: {
            signupLink: true,
            checkIn: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    const csvRows = [
        ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Plus Ones', 'Note', 'Link Title', 'Checked In'],
    ];

    guests.forEach(guest => {
        let source = 'Deleted Link';
        if (guest.signupLink) {
            source = guest.signupLink.title || guest.signupLink.slug;
        } else if (guest.promoterId) {
            source = 'Manual';
        }

        csvRows.push([
            guest.id,
            guest.firstName,
            guest.lastName,
            guest.email || '',
            guest.phone || '',
            guest.plusOnesCount.toString(),
            guest.note || '',
            source,
            guest.checkIn ? (!guest.checkIn.checkedOutAt ? 'Checked In' : 'Checked Out') : 'Not Arrived',
        ]);
    });

    const csvString = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    return new NextResponse(csvString, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="my-guests-${id}.csv"`,
        },
    });
}
