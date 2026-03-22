import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email) {
        console.warn('[seed] SUPER_ADMIN_EMAIL is not set; aborting super admin seed.');
        process.exit(1);
    }

    if (!password) {
        console.warn('[seed] SUPER_ADMIN_PASSWORD is not set; aborting super admin seed.');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            role: Role.SUPER_ADMIN,
            emailVerified: new Date(),
        },
        create: {
            email,
            name: 'Admin User',
            passwordHash: hashedPassword,
            role: Role.SUPER_ADMIN,
            emailVerified: new Date(),
        },
    });

    console.log(`[seed] Super admin upserted: ${email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
