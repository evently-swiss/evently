'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

type SetupPasswordState = {
  success?: boolean;
  message?: string;
  errors?: {
    password?: string;
    confirmPassword?: string;
  };
} | null;

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export async function setupPassword(
  token: string,
  prevState: SetupPasswordState,
  formData: FormData,
): Promise<SetupPasswordState> {
  if (!token) {
    return { message: 'Invalid or expired link.' };
  }

  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
    select: { id: true, mustChangePassword: true },
  });

  if (!user || !user.mustChangePassword) {
    return { message: 'This setup link is invalid or has already been used.' };
  }

  const result = schema.safeParse({
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  });

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return { errors: { password: fieldErrors.password?.[0], confirmPassword: fieldErrors.confirmPassword?.[0] } };
  }

  const hashedPassword = await bcrypt.hash(result.data.password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      mustChangePassword: false,
      verificationToken: null,
      emailVerified: new Date(),
    },
  });

  return { success: true };
}
