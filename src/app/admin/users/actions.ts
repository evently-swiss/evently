'use server';

import { Role } from '@prisma/client';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ActionState } from '@/lib/definitions';



const userSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'PROMOTER', 'ENTRY_STAFF']),
});

export async function createUser(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        return { message: 'Unauthorized' };
    }

    const validatedFields = userSchema.safeParse({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        role: formData.get('role') as string,
    });

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }

    const { name, email, password, role } = validatedFields.data;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                role: role as Role,
            },
        });
    } catch (error) {
        console.error(error);
        return { message: 'Failed to create user. Email might be taken.' };
    }

    redirect('/admin/users');
}

export async function deleteUser(userId: string, formData: FormData) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        // return { message: 'Unauthorized' };
        return;
    }

    // Prevent deleting self
    if (session.user.id === userId) {
        // return { message: 'Cannot delete yourself.' };
        return;
    }

    try {
        await prisma.user.delete({
            where: { id: userId },
        });
        revalidatePath('/admin/users');
    } catch (error) {
        console.error(error);
        // return { message: 'Failed to delete user.' };
    }
}
