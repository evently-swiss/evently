'use server';

import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ActionState } from '@/lib/definitions';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/verification-email';

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export async function registerUser(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { message: 'This email is already registered.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = randomUUID();

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: null,
        verificationToken,
      },
    });

    await sendVerificationEmail({ to: email, token: verificationToken });
  } catch (error) {
    console.error('Failed to register user', error);
    return { message: 'Failed to create account. Please try again.' };
  }

  redirect('/register/verify-sent');
}
