'use server';

import prisma from '@/lib/prisma';
import { normalizePhone } from '@/lib/guest-utils';
import { ActionState } from '@/lib/definitions';
import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const reservationSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80, 'First name is too long'),
  lastName: z.string().trim().min(1, 'Last name is required').max(80, 'Last name is too long'),
  phone: z.string().trim().min(1, 'Phone is required'),
  arrivalTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Arrival time must be a valid time'),
  numberOfGuests: z
    .string()
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => Number.isInteger(value) && value >= 1 && value <= 30, {
      message: 'Number of guests must be between 1 and 30',
    }),
  comments: z.string().trim().max(500, 'Comments are too long').optional(),
});

function parseLoungeNumbers(values: FormDataEntryValue[]): number[] {
  return Array.from(
    new Set(
      values
        .map((value) => Number.parseInt(String(value), 10))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ).sort((a, b) => a - b);
}

export async function createLoungeReservation(
  eventSlug: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      slug: true,
      status: true,
      venueId: true,
    },
  });

  if (!event || event.status !== 'PUBLISHED') {
    return { message: 'This reservation page is not available.' };
  }

  if (!event.venueId) {
    return { message: 'This event is missing a venue configuration.' };
  }

  const validatedFields = reservationSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone'),
    arrivalTime: formData.get('arrivalTime'),
    numberOfGuests: formData.get('numberOfGuests'),
    comments: (formData.get('comments') as string) || undefined,
  });

  const loungeNumbers = parseLoungeNumbers(formData.getAll('loungeNumbers'));

  if (!validatedFields.success) {
    return {
      errors: {
        ...validatedFields.error.flatten().fieldErrors,
        ...(loungeNumbers.length === 0
          ? { loungeNumbers: ['Select at least one lounge number'] }
          : {}),
      },
    };
  }

  if (loungeNumbers.length === 0) {
    return {
      errors: {
        loungeNumbers: ['Select at least one lounge number'],
      },
    };
  }

  const normalizedPhone = normalizePhone(validatedFields.data.phone);
  if (!normalizedPhone || !/^\+41\d{9}$/.test(normalizedPhone)) {
    return {
      errors: {
        phone: ['Enter a valid Swiss phone number'],
      },
    };
  }

  try {
    await prisma.loungeReservation.create({
      data: {
        eventId: event.id,
        venueId: event.venueId,
        firstName: validatedFields.data.firstName,
        lastName: validatedFields.data.lastName,
        phone: normalizedPhone,
        arrivalTime: validatedFields.data.arrivalTime,
        numberOfGuests: validatedFields.data.numberOfGuests,
        loungeNumbers,
        comments: validatedFields.data.comments || null,
        status: 'PENDING',
        minConsumation: new Prisma.Decimal(0),
      },
    });
  } catch (error) {
    console.error(error);
    return {
      message: 'Failed to submit reservation. Please try again.',
    };
  }

  redirect(`/lounge/${event.slug}/confirmation`);
}
