'use server';

import { randomUUID } from 'crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/password-reset-email';
import { ActionState } from '@/lib/definitions';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
});

const genericResponse: ActionState = {
  success: true,
  message: 'If an account exists for that email, we sent a password reset link.',
};

export async function requestPasswordReset(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    return genericResponse;
  }

  try {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await sendPasswordResetEmail({
      to: user.email,
      token,
    });
  } catch (error) {
    console.error('Failed to request password reset', error);
  }

  return genericResponse;
}
