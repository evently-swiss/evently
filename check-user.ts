import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'admin@example.com' },
        });

        if (!user) {
            console.log('User admin@example.com NOT found.');
        } else {
            console.log('User found:', user);
            const isMatch = await bcrypt.compare('password123', user.passwordHash);
            console.log('Password match for "password123":', isMatch);
        }
    } catch (e) {
        console.error('Error connecting to DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
