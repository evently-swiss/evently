'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { ActionState } from '@/lib/definitions';



export async function checkInGuest(guestId: string, eventId: string, count: number = 1): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'ENTRY_STAFF' && session.user.role !== 'ADMIN')) {
        return { message: 'Unauthorized', success: false };
    }

    try {
        // Check if already checked in
        const existingCheckIn = await prisma.checkIn.findUnique({
            where: { guestId },
        });

        if (existingCheckIn) {
            // If checked out, re-check in with new count
            if (existingCheckIn.checkedOutAt) {
                await prisma.checkIn.update({
                    where: { guestId },
                    data: {
                        checkedOutAt: null,
                        checkedOutCount: null,
                        checkedInByUserId: session.user.id,
                        checkedInAt: new Date(),
                        checkedInCount: count,
                    },
                });
            } else {
                // Already checked in and not checked out - do nothing or return success
                return { success: true, message: 'Guest already checked in' };
            }
        } else {
            await prisma.checkIn.create({
                data: {
                    guestId,
                    checkedInByUserId: session.user.id,
                    checkedInCount: count,
                },
            });
        }
    } catch (error) {
        console.error(error);
        return { message: 'Failed to check in guest.' };
    }

    revalidatePath(`/door/${eventId}`);
    return { success: true };
}

export async function checkOutGuest(guestId: string, eventId: string, count: number = 1): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'ENTRY_STAFF' && session.user.role !== 'ADMIN')) {
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
