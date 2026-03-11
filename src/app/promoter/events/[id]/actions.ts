'use server';

import prisma from '@/lib/prisma';
import { LinkType, FieldMode } from '@prisma/client';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ActionState } from '@/lib/definitions';



const linkSchema = z.object({
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
    type: z.enum(['PROMOTER', 'PERSONAL']),
    title: z.string().optional(),
    maxTotalGuests: z.string().transform((val) => (val ? parseInt(val, 10) : null)).optional(),
    maxPlusOnesPerSignup: z.string().default("3").transform((val) => parseInt(val, 10)),
    emailMode: z.enum(['HIDDEN', 'OPTIONAL', 'REQUIRED']),
    phoneMode: z.enum(['HIDDEN', 'OPTIONAL', 'REQUIRED']),
    allowNotes: z.string().transform((val) => val === 'on').optional(),
});

export async function createPromoterLink(eventId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'PROMOTER' && session.user.role !== 'ADMIN')) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = linkSchema.safeParse({
        slug: formData.get('slug'),
        type: formData.get('type'),
        title: (formData.get('title') as string) || undefined,
        maxTotalGuests: (formData.get('maxTotalGuests') as string) || undefined,
        maxPlusOnesPerSignup: (formData.get('maxPlusOnesPerSignup') as string) || undefined,
        emailMode: formData.get('emailMode'),
        phoneMode: formData.get('phoneMode'),
        allowNotes: (formData.get('allowNotes') as string) || undefined,
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const data = validatedFields.data;

    try {
        await prisma.signupLink.create({
            data: {
                eventId,
                slug: data.slug,
                type: data.type as LinkType,
                title: data.title,
                maxTotalGuests: data.maxTotalGuests,
                maxPlusOnesPerSignup: data.maxPlusOnesPerSignup,
                emailMode: data.emailMode as FieldMode,
                phoneMode: data.phoneMode as FieldMode,
                allowNotes: !!data.allowNotes,
                singleUse: data.type === 'PERSONAL',
                assignedPromoters: {
                    connect: [{ id: session.user.id }] // Always assign to self
                },
            },
        });
    } catch (error) {
        console.error(error);
        return { message: 'Failed to create link. Slug might be taken.' };
    }

    revalidatePath(`/promoter/events/${eventId}`);
    return { message: 'Link created successfully', success: true };
}

export async function updatePromoterLink(linkId: string, eventId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'PROMOTER' && session.user.role !== 'ADMIN')) {
        return { message: 'Unauthorized' };
    }

    // First, check if this link belongs to the promoter
    const existingLink = await prisma.signupLink.findUnique({
        where: { id: linkId },
        include: {
            assignedPromoters: true
        },
    });

    if (!existingLink) {
        return { message: 'Link not found' };
    }

    if (session.user.role === 'PROMOTER' && !existingLink.assignedPromoters?.some(p => p.id === session.user.id)) {
        return { message: 'Unauthorized - you can only edit links assigned to you' };
    }

    const validatedFields = linkSchema.safeParse({
        slug: formData.get('slug'),
        type: formData.get('type'),
        title: (formData.get('title') as string) || undefined,
        maxTotalGuests: (formData.get('maxTotalGuests') as string) || undefined,
        maxPlusOnesPerSignup: (formData.get('maxPlusOnesPerSignup') as string) || '3',
        emailMode: formData.get('emailMode'),
        phoneMode: formData.get('phoneMode'),
        allowNotes: (formData.get('allowNotes') as string) || undefined,
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const data = validatedFields.data;
    const active = formData.get('active') === 'on';

    try {
        await prisma.signupLink.update({
            where: { id: linkId },
            data: {
                slug: data.slug,
                type: data.type as LinkType,
                title: data.title,
                maxTotalGuests: data.maxTotalGuests,
                maxPlusOnesPerSignup: data.maxPlusOnesPerSignup,
                emailMode: data.emailMode as FieldMode,
                phoneMode: data.phoneMode as FieldMode,
                allowNotes: !!data.allowNotes,
                active,
                singleUse: data.type === 'PERSONAL',
            },
        });
    } catch (error) {
        console.error(error);
        return { message: 'Failed to update link. Slug might be taken.' };
    }

    revalidatePath(`/promoter/events/${eventId}`);
    return { message: 'Link updated successfully', success: true };
}

export async function deletePromoterLink(linkId: string, eventId: string): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'PROMOTER' && session.user.role !== 'ADMIN')) {
        return { message: 'Unauthorized' };
    }

    // Check ownership
    const existingLink = await prisma.signupLink.findUnique({
        where: { id: linkId },
        include: {
            assignedPromoters: true
        },
    });

    if (!existingLink) {
        return { message: 'Link not found' };
    }

    if (session.user.role === 'PROMOTER' && !existingLink.assignedPromoters?.some(p => p.id === session.user.id)) {
        return { message: 'Unauthorized - you can only delete links assigned to you' };
    }

    try {
        await prisma.signupLink.delete({
            where: { id: linkId },
        });
    } catch (error) {
        console.error(error);
        return { message: 'Failed to delete link.' };
    }

    revalidatePath(`/promoter/events/${eventId}`);
    return { message: 'Link deleted successfully', success: true };
}

import { normalizePhone, findDuplicateGuest } from '@/lib/guest-utils';

const guestSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    plusOnes: z.coerce.number().min(0),
    note: z.string().optional(),
});

export async function addGuest(eventId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'PROMOTER' && session.user.role !== 'ADMIN')) {
        return { message: 'Unauthorized' };
    }

    const validatedFields = guestSchema.safeParse({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        plusOnes: formData.get('plusOnes'),
        note: formData.get('note'),
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const { firstName, lastName, email, phone, plusOnes, note } = validatedFields.data;
    const cleanPhone = normalizePhone(phone);

    // Duplicate Check
    const duplicate = await findDuplicateGuest(eventId, { firstName, lastName, email, phone: cleanPhone });
    if (duplicate) {
        return { message: `Guest ${duplicate.firstName} ${duplicate.lastName} already exists on this list.` };
    }

    try {
        await prisma.guest.create({
            data: {
                eventId,
                // No signupLinkId for manual adds
                promoterId: session.user.id,
                firstName,
                lastName,
                email: email || null,
                phone: cleanPhone,
                plusOnesCount: plusOnes,
                note,
            },
        });

    } catch (error) {
        console.error(error);
        return { message: 'Failed to add guest.' };
    }


    revalidatePath(`/promoter/events/${eventId}`);
    return { success: true };
}

export async function updateGuest(guestId: string, eventId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'PROMOTER' && session.user.role !== 'ADMIN')) {
        return { message: 'Unauthorized' };
    }

    // Check ownership
    const guest = await prisma.guest.findUnique({
        where: { id: guestId },
        include: {
            signupLink: {
                include: {
                    assignedPromoters: true
                }
            }
        },
    });

    if (!guest) {
        return { message: 'Guest not found' };
    }

    if (session.user.role === 'PROMOTER') {
        const isOwned = guest.promoterId === session.user.id ||
            guest.signupLink?.assignedPromoters?.some(p => p.id === session.user.id);
        if (!isOwned) {
            return { message: 'Unauthorized - you can only edit guests on your lists' };
        }
    }

    const validatedFields = guestSchema.safeParse({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        plusOnes: formData.get('plusOnes'),
        note: formData.get('note'),
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const { firstName, lastName, email, phone, plusOnes, note } = validatedFields.data;
    const cleanPhone = normalizePhone(phone);

    // We skip duplicate check on update for now, or we check if it conflicts with ANOTHER guest
    // Doing a check excluding self would be better, but user didn't explicitly ask for update validation, mostly import/add.
    // However, let's keep it safe. If they rename to someone else who exists, warn?
    // Let's implement strict check: if data changes to match another guest.
    const duplicate = await findDuplicateGuest(eventId, { firstName, lastName, email, phone: cleanPhone });
    if (duplicate && duplicate.id !== guestId) {
        return { message: `Another guest with name ${duplicate.firstName} ${duplicate.lastName} already exists.` };
    }

    try {
        await prisma.guest.update({
            where: { id: guestId },
            data: {
                firstName,
                lastName,
                email: email || null,
                phone: cleanPhone,
                plusOnesCount: plusOnes,
                note,
            },
        });
    } catch (error) {
        console.error(error);
        return { message: 'Failed to update guest.' };
    }

    revalidatePath(`/promoter/events/${eventId}`);
    revalidatePath(`/admin/events/${eventId}`);
    return { message: 'Guest updated successfully', success: true };
}

export async function deleteGuest(guestId: string, eventId: string): Promise<ActionState> {
    const session = await auth();
    if (!session || (session.user.role !== 'PROMOTER' && session.user.role !== 'ADMIN')) {
        return { message: 'Unauthorized' };
    }

    // Check ownership
    const guest = await prisma.guest.findUnique({
        where: { id: guestId },
        include: {
            signupLink: {
                include: {
                    assignedPromoters: true
                }
            }
        },
    });

    if (!guest) {
        return { message: 'Guest not found' };
    }

    if (session.user.role === 'PROMOTER') {
        const isOwned = guest.promoterId === session.user.id ||
            guest.signupLink?.assignedPromoters?.some(p => p.id === session.user.id);
        if (!isOwned) {
            return { message: 'Unauthorized - you can only delete guests on your lists' };
        }
    }

    try {
        await prisma.guest.delete({
            where: { id: guestId },
        });
    } catch (error) {
        console.error(error);
        return { message: 'Failed to delete guest.' };
    }

    revalidatePath(`/promoter/events/${eventId}`);
    revalidatePath(`/admin/events/${eventId}`);
    return { message: 'Guest deleted successfully', success: true };
}
