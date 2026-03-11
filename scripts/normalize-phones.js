const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalizePhone(phone) {
    if (!phone) return null;

    // Strip spaces, dashes, parens
    let clean = phone.replace(/[\s\-\(\)]/g, '');

    // Handle empty
    if (clean.length < 3) return null;

    // 1. Explicit International (starts with +)
    if (clean.startsWith('+')) {
        return clean.replace(/[^\d+]/g, ''); // Ensure only digits after +
    }

    // 2. Explicit International (starts with 00)
    if (clean.startsWith('00')) {
        return '+' + clean.substring(2).replace(/\D/g, '');
    }

    // 3. Local format with leading zero (e.g. 079...) -> Treat as Swiss (+41) by default
    if (clean.startsWith('0')) {
        return '+41' + clean.substring(1).replace(/\D/g, '');
    }

    // 4. No leading zero, no +, no 00 (e.g. 796261271 or 41796261271)
    const digits = clean.replace(/\D/g, '');

    // Heuristic: If it starts with 41 and looks long enough (11 digits: 41 79 123 45 67), assume it implies 41
    if (digits.startsWith('41') && digits.length >= 11) {
        return '+' + digits;
    }

    // Otherwise, assume it's a local number missing the leading zero (e.g. 79... user example)
    return '+41' + digits;
}

async function main() {
    console.log('Starting phone number normalization...');

    const guests = await prisma.guest.findMany({
        where: {
            phone: {
                not: null
            }
        }
    });

    console.log(`Found ${guests.length} guests with phone numbers.`);

    let updatedCount = 0;

    for (const guest of guests) {
        const normalized = normalizePhone(guest.phone);

        if (normalized && normalized !== guest.phone) {
            try {
                await prisma.guest.update({
                    where: { id: guest.id },
                    data: { phone: normalized }
                });
                updatedCount++;
                if (updatedCount % 100 === 0) {
                    process.stdout.write(`.`);
                }
            } catch (e) {
                console.error(`Failed to update guest ${guest.id}:`, e.message);
            }
        }
    }

    console.log(`\nNormalization complete. Updated ${updatedCount} guests.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
