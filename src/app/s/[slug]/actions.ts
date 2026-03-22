'use server';

import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ActionState } from '@/lib/definitions';



import { normalizePhone, findDuplicateGuest } from '@/lib/guest-utils';

export async function signupGuest(slug: string, prevState: ActionState, formData: FormData) {
    // 1. Fetch Link & Event
    const link = await prisma.signupLink.findUnique({
        where: { slug },
        include: {
            event: {
                include: {
                    _count: { select: { guests: true } }
                }
            },
            _count: { select: { guests: true } }
        }
    });

    if (!link || !link.active || link.event.status !== 'PUBLISHED') {
        return { message: 'This signup link is invalid or expired.' };
    }

    // 2. Check Quotas
    // Link Quota
    if (link.maxTotalGuests && link._count.guests >= link.maxTotalGuests) {
        return { message: 'This guestlist is full.' };
    }

    // Single Use Check
    if (link.singleUse && link._count.guests > 0) {
        return { message: 'This link has already been used.' };
    }

    // Event Capacity
    if (link.event.capacity && link.event._count.guests >= link.event.capacity) {
        return { message: 'The event is at full capacity.' };
    }

    // 3. Validate Form Data
    const plusOnes = parseInt(formData.get('plusOnes') as string || '0', 10);

    if (plusOnes > link.maxPlusOnesPerSignup) {
        return { message: `You can only bring up to ${link.maxPlusOnesPerSignup} guests.` };
    }

    const rawEmail = (formData.get('email') as string) || '';
    const rawPhone = (formData.get('phone') as string) || '';
    const hasSubmittedHiddenEmail = link.emailMode === 'HIDDEN' && rawEmail.trim().length > 0;
    const hasSubmittedHiddenPhone = link.phoneMode === 'HIDDEN' && rawPhone.trim().length > 0;

    if (hasSubmittedHiddenEmail || hasSubmittedHiddenPhone) {
        return { message: 'This signup link does not accept email or phone values.' };
    }

    const schema = z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: link.emailMode === 'REQUIRED' ? z.string().email("Invalid email") : z.string().optional().or(z.literal('')),
        phone: link.phoneMode === 'REQUIRED' ? z.string().min(1, "Phone is required") : z.string().optional().or(z.literal('')),
        note: z.string().optional(),
    });

    const validatedFields = schema.safeParse({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: rawEmail,
        phone: rawPhone,
        note: (formData.get('note') as string) || undefined,
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const data = validatedFields.data;
    const cleanPhone = normalizePhone(data.phone);

    // 4. Duplicate Check
    const duplicate = await findDuplicateGuest(link.eventId, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: cleanPhone
    });

    if (duplicate) {
        return { message: `You are already on the guestlist for ${link.event.name}.` };
    }

    // 5. Create Guest
    try {
        const guest = await prisma.guest.create({
            data: {
                eventId: link.eventId,
                signupLinkId: link.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email || null,
                phone: cleanPhone,
                plusOnesCount: plusOnes,
                note: data.note || null,
                qrToken: crypto.randomUUID(),
                rsvpStatus: 'CONFIRMED',
            },
            select: {
                qrToken: true,
            },
        });

        if (!guest.qrToken) {
            return { message: 'Failed to generate QR token. Please try again.' };
        }

        redirect(`/s/${slug}/confirmation?token=${encodeURIComponent(guest.qrToken)}`);
    } catch (error) {
        if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
            throw error;
        }
        console.error(error);
        return { message: 'Failed to sign up. Please try again.' };
    }
}
