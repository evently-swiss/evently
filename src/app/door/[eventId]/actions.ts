'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionState } from '@/lib/definitions';

async function upsertCheckIn(guestId: string, userId: string, count: number): Promise<{ ok: true } | { ok: false; alreadyCheckedIn: true }> {
    const existingCheckIn = await prisma.checkIn.findUnique({
        where: { guestId },
    });

    if (existingCheckIn) {
        if (existingCheckIn.checkedOutAt) {
            await prisma.checkIn.update({
                where: { guestId },
                data: {
                    checkedOutAt: null,
                    checkedOutCount: null,
                    checkedInByUserId: userId,
                    checkedInAt: new Date(),
                    checkedInCount: count,
                },
            });
            return { ok: true };
        }

        return { ok: false, alreadyCheckedIn: true };
    }

    await prisma.checkIn.create({
        data: {
            guestId,
            checkedInByUserId: userId,
            checkedInCount: count,
        },
    });

    return { ok: true };
}

export async function checkInGuest(guestId: string, eventId: string, count: number = 1): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'ENTRY_STAFF' && session.user.role !== 'SUPER_ADMIN')) {
        return { message: 'Unauthorized', success: false };
    }

    try {
        const checkInResult = await upsertCheckIn(guestId, session.user.id, count);
        if (!checkInResult.ok) {
            return { success: true, message: 'Guest already checked in' };
        }
    } catch (error) {
        console.error(error);
        return { message: 'Failed to check in guest.' };
    }

    revalidatePath(`/door/${eventId}`);
    return { success: true };
}

export async function checkInByToken(token: string, eventId: string): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'ENTRY_STAFF' && session.user.role !== 'SUPER_ADMIN')) {
        return { message: 'Unauthorized', success: false };
    }

    const trimmedToken = token.trim();
    if (!trimmedToken) {
        return { message: 'Invalid QR token', success: false };
    }

    let checkedInName = '';

    try {
        const guest = await prisma.guest.findUnique({
            where: { qrToken: trimmedToken },
            select: {
                id: true,
                eventId: true,
                firstName: true,
                lastName: true,
            },
        });

        if (!guest) {
            return { message: 'Invalid QR token', success: false };
        }

        if (guest.eventId !== eventId) {
            return { message: 'This QR code is for a different event', success: false };
        }

        const checkInResult = await upsertCheckIn(guest.id, session.user.id, 1);
        if (!checkInResult.ok) {
            return { message: `${guest.firstName} ${guest.lastName} is already checked in`, success: false };
        }

        checkedInName = `${guest.firstName} ${guest.lastName}`;
    } catch (error) {
        console.error(error);
        return { message: 'Failed to check in guest by QR code.', success: false };
    }

    revalidatePath(`/door/${eventId}`);
    return { success: true, message: `Checked in ${checkedInName}` };
}

export async function checkOutGuest(guestId: string, eventId: string, count: number = 1): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'ENTRY_STAFF' && session.user.role !== 'SUPER_ADMIN')) {
        return { message: 'Unauthorized', success: false };
    }

    try {
        await prisma.checkIn.update({
            where: { guestId },
            data: {
                checkedOutAt: new Date(),
                checkedOutCount: count,
            },
        });
    } catch (error) {
        console.error(error);
        return { message: 'Failed to check out guest.' };
    }

    revalidatePath(`/door/${eventId}`);
    return { success: true };
}
