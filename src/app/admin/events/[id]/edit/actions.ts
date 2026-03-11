'use server';

import { EventStatus } from '@prisma/client';
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
    address: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']),
    capacity: z.string().transform((val) => (val ? parseInt(val, 10) : null)).nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    heroImageUrl: z.string().nullable().optional(),
    accentColor: z.string().nullable().optional(),
    doorStaffIds: z.array(z.string()).optional(),
    promoterIds: z.array(z.string()).optional(),
});

export async function updateEvent(id: string, prevState: any, formData: FormData) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        return { message: 'Unauthorized' };
    }

    const rawData = {
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        date: formData.get('date') as string,
        startTime: (formData.get('startTime') as string) || null,
        endTime: (formData.get('endTime') as string) || null,
        venueName: (formData.get('venueName') as string) || null,
        address: (formData.get('address') as string) || null,
        description: (formData.get('description') as string) || null,
        status: formData.get('status') as any,
        capacity: (formData.get('capacity') as string) || null,
        logoUrl: (formData.get('logoUrl') as string) || null,
        heroImageUrl: (formData.get('heroImageUrl') as string) || null,
        accentColor: (formData.get('accentColor') as string) || null,
        doorStaffIds: formData.getAll('doorStaffIds') as string[],
        promoterIds: formData.getAll('promoterIds') as string[],
    };

    const validatedFields = eventSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const { doorStaffIds, promoterIds, ...updateData } = validatedFields.data;

    try {
        await prisma.event.update({
            where: { id },
            data: {
                ...updateData,
                date: new Date(updateData.date),
                doorStaff: {
                    set: doorStaffIds?.map(id => ({ id })) || [],
                },
                assignedPromoters: {
                    set: promoterIds?.map(id => ({ id })) || [],
                },
            },
        });
    } catch (error) {
        console.error(error);
        return { message: 'Failed to update event. Slug might be taken.' };
    }

    redirect(`/admin/events/${id}`);
}
