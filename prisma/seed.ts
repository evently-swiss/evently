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

    const user = await prisma.user.upsert({
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

    // Ensure the super admin has an active subscription so /admin routes are accessible.
    // SUPER_ADMIN users are gated by OperatorSubscription; without one they are redirected
    // to /pricing — which breaks the dev smoke E2E test.
    const existingSubscription = await prisma.operatorSubscription.findFirst({
        where: { userId: user.id, status: { in: ['ACTIVE', 'TRIALING'] } },
    });

    if (!existingSubscription) {
        await prisma.operatorSubscription.create({
            data: {
                userId: user.id,
                status: 'TRIALING',
                planId: 'seed',
            },
        });
        console.log(`[seed] OperatorSubscription (TRIALING) created for: ${email}`);
    } else {
        console.log(`[seed] OperatorSubscription already exists for: ${email}`);
    }

    const venues = [
        { name: 'Hive Club Zurich', slug: 'hive-club-zurich', city: 'Zurich', country: 'CH' },
        { name: 'Icon Club', slug: 'icon-club', city: 'Zurich', country: 'CH' },
        { name: 'Jade Club', slug: 'jade-club', city: 'Zurich', country: 'CH' },
        { name: 'Kaufleuten', slug: 'kaufleuten', city: 'Zurich', country: 'CH' },
    ];

    for (const venue of venues) {
        await prisma.venue.upsert({
            where: { slug: venue.slug },
            update: venue,
            create: venue,
        });
    }

    console.log('[seed] Venues upserted:', venues.map(v => v.slug).join(', '));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
