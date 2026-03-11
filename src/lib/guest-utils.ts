import prisma from '@/lib/prisma';

export function normalizePhone(phone: string | null | undefined): string | null {
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

export async function findDuplicateGuest(eventId: string, guest: { firstName: string, lastName: string, email?: string | null, phone?: string | null }) {
    const normalizedPhone = normalizePhone(guest.phone);
    const normalizedEmail = guest.email ? guest.email.toLowerCase().trim() : null;
    const normalizedName = {
        first: guest.firstName.toLowerCase().trim(),
        last: guest.lastName.toLowerCase().trim()
    };

    // Build query conditions
    const OR = [];

    if (normalizedEmail) {
        OR.push({ email: { equals: normalizedEmail, mode: 'insensitive' as const } });
    }

    if (normalizedPhone) {
        // We assume DB phones are already normalized if using this util
        OR.push({ phone: normalizedPhone });
    }

    // Name check
    OR.push({
        AND: [
            { firstName: { equals: normalizedName.first, mode: 'insensitive' as const } },
            { lastName: { equals: normalizedName.last, mode: 'insensitive' as const } }
        ]
    });

    return await prisma.guest.findFirst({
        where: {
            eventId,
            OR
        }
    });
}
