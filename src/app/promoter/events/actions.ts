'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ActionState } from '@/lib/definitions';



const eventSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
    date: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    venueName: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
    capacity: z.string().transform((val) => (val ? parseInt(val, 10) : null)).nullable().optional(),
});

export async function createPromoterEvent(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'PROMOTER' && session.user.role !== 'ADMIN')) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = eventSchema.safeParse({
        name: formData.get('name'),
        slug: formData.get('slug'),
        date: formData.get('date'),
        startTime: (formData.get('startTime') as string) || undefined,
        endTime: (formData.get('endTime') as string) || undefined,
        venueName: (formData.get('venueName') as string) || undefined,
        description: (formData.get('description') as string) || undefined,
        status: (formData.get('status') as string) || 'DRAFT',
        capacity: (formData.get('capacity') as string) || null,
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const data = validatedFields.data;

    try {
        await prisma.event.create({
            data: {
                ...data,
                date: new Date(data.date),
                createdByUserId: session.user.id,
                // Auto-assign creator to the event
                assignedPromoters: {
                    connect: { id: session.user.id }
                }
            },
        });
    } catch (error) {
        console.error(error);
        return { message: 'Failed to create event. Slug might be taken.' };
    }

    redirect('/promoter/events');
}

import { normalizePhone, findDuplicateGuest } from '@/lib/guest-utils';

const guestSchema = z.object({
    id: z.string().optional(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    plusOnesCount: z.number().int().min(0).default(0),
    note: z.string().optional().or(z.literal('')),
});

const importGuestsSchema = z.array(guestSchema);

export async function importGuests(eventId: string, prevState: ActionState, guests: any[]): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'PROMOTER' && session.user.role !== 'ADMIN')) {
        return { message: 'Unauthorized' };
    }

    // specific validation for the array input
    const validatedGuests = importGuestsSchema.safeParse(guests);

    if (!validatedGuests.success) {
        return { message: 'Invalid guest data format. Please check your CSV data.' };
    }

    const guestsToImport = validatedGuests.data;
    let created = 0;
    let updated = 0;

    try {
        for (const g of guestsToImport) {
            const cleanPhone = normalizePhone(g.phone);

            // 1. Try to find existing guest:
            //    a) By ID (if provided)
            //    b) By Duplicate Check
            let existingGuest = null;

            if (g.id) {
                existingGuest = await prisma.guest.findUnique({ where: { id: g.id } });
                // Check if it belongs to event? Yes, crucial.
                if (existingGuest && existingGuest.eventId !== eventId) {
                    existingGuest = null; // Ignore ID if it mismatches event (security/logic safety)
                }
            }

            if (!existingGuest) {
                existingGuest = await findDuplicateGuest(eventId, {
                    firstName: g.firstName,
                    lastName: g.lastName,
                    email: g.email || null,
                    phone: cleanPhone
                });
            }

            if (existingGuest) {
                // Update
                // We overwrite fields if they are present in CSV? 
                // Assumption: CSV is the source of truth for the import session.
                await prisma.guest.update({
                    where: { id: existingGuest.id },
                    data: {
                        firstName: g.firstName,
                        lastName: g.lastName,
                        email: g.email || null,
                        phone: cleanPhone,
                        plusOnesCount: g.plusOnesCount,
                        note: g.note || null,
                    }
                });
                updated++;
            } else {
                // Create
                await prisma.guest.create({
                    data: {
                        eventId: eventId,
                        promoterId: session.user.id,
                        firstName: g.firstName,
                        lastName: g.lastName,
                        email: g.email || null,
                        phone: cleanPhone,
                        plusOnesCount: g.plusOnesCount,
                        note: g.note || null,
                    }
                });
                created++;
            }
        }

        revalidatePath(`/promoter/events/${eventId}`);
        return { success: true, message: `Import complete: ${created} created, ${updated} updated.` };

    } catch (error) {
        console.error("Import error:", error);
        return { message: 'Failed to import guests. Database error.' };
    }
}
