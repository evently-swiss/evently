'use server';

import { EventStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ActionState } from '@/lib/definitions';



const eventSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
    date: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    venueName: z.string().optional(),
    address: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']),
    capacity: z.string().transform((val) => (val ? parseInt(val, 10) : null)).optional(),
    logoUrl: z.string().optional(),
    heroImageUrl: z.string().optional(),
    accentColor: z.string().optional(),
    doorStaffIds: z.array(z.string()).optional(),
    promoterIds: z.array(z.string()).optional(),
});

export async function createEvent(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        return { message: 'Unauthorized' };
    }

    const rawData = {
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        date: formData.get('date') as string,
        startTime: (formData.get('startTime') as string) || undefined,
        endTime: (formData.get('endTime') as string) || undefined,
        venueName: (formData.get('venueName') as string) || undefined,
        address: (formData.get('address') as string) || undefined,
        description: (formData.get('description') as string) || undefined,
        status: formData.get('status') as any,
        capacity: (formData.get('capacity') as string) || undefined,
        logoUrl: (formData.get('logoUrl') as string) || undefined,
        heroImageUrl: (formData.get('heroImageUrl') as string) || undefined,
        accentColor: (formData.get('accentColor') as string) || undefined,
        doorStaffIds: formData.getAll('doorStaffIds') as string[],
        promoterIds: formData.getAll('promoterIds') as string[],
    };

    const validatedFields = eventSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const { doorStaffIds, promoterIds, ...data } = validatedFields.data;

    try {
        await prisma.event.create({
            data: {
                ...data,
                date: new Date(data.date),
                createdByUserId: session.user.id,
                doorStaff: {
                    connect: doorStaffIds?.map(id => ({ id })) || [],
                },
                assignedPromoters: {
                    connect: promoterIds?.map(id => ({ id })) || [],
                },
            },
        });
    } catch (error) {
        console.error(error);
        return { message: 'Failed to create event. Slug might be taken.' };
    }

    redirect('/admin/events');
}
