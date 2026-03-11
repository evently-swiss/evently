'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';



const eventSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
    date: z.string(),
    startTime: z.string().nullable().optional(),
    endTime: z.string().nullable().optional(),
    venueName: z.string().nullable().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']),
    capacity: z.string().transform((val) => (val ? parseInt(val, 10) : null)).nullable().optional(),
});

export async function updateEvent(id: string, prevState: any, formData: FormData) {
    const session = await auth();
    if (!session || (session.user.role !== 'PROMOTER' && session.user.role !== 'ADMIN')) {
        return { message: 'Unauthorized' };
    }

    // Verify user is the creator
    const event = await prisma.event.findUnique({
        where: { id },
        select: { createdByUserId: true },
    });

    if (!event || event.createdByUserId !== session.user.id) {
        return { message: 'You can only edit events you created' };
    }

    const rawData = {
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        date: formData.get('date') as string,
        startTime: (formData.get('startTime') as string) || null,
        endTime: (formData.get('endTime') as string) || null,
        venueName: (formData.get('venueName') as string) || null,
        status: formData.get('status') as any,
        capacity: (formData.get('capacity') as string) || null,
    };

    const validatedFields = eventSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const updateData = validatedFields.data;

    try {
        await prisma.event.update({
            where: { id },
            data: {
                ...updateData,
                date: new Date(updateData.date),
            },
        });
    } catch (error) {
        console.error(error);
        return { message: 'Failed to update event. Slug might be taken.' };
    }

    redirect(`/promoter/events/${id}`);
}
