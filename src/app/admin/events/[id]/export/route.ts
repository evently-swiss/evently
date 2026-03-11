import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';



export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const { id } = await params;

    const guests = await prisma.guest.findMany({
        where: { eventId: id },
        include: {
            signupLink: true,
            checkIn: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    const csvRows = [
        ['First Name', 'Last Name', 'Email', 'Phone', 'Plus Ones', 'Note', 'Link Title', 'Link Type', 'Checked In', 'Checked In At'],
    ];

    guests.forEach(guest => {
        csvRows.push([
            guest.firstName,
            guest.lastName,
            guest.email || '',
            guest.phone || '',
            guest.plusOnesCount.toString(),
            guest.note || '',
            guest.signupLink?.title || guest.signupLink?.slug || 'Deleted Link',
            guest.signupLink?.type || 'N/A',
            guest.checkIn ? 'Yes' : 'No',
            guest.checkIn ? guest.checkIn.checkedInAt.toISOString() : '',
        ]);
    });

    const csvString = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    return new NextResponse(csvString, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="guests-${id}.csv"`,
        },
    });
}
