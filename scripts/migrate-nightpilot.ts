/**
 * One-time migration script: Nightpilot MongoDB JSON → PostgreSQL.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/migrate-nightpilot.ts [--dry-run]
 *
 * Prerequisites:
 *   1. Run scripts/export-nightpilot.sh to populate scripts/migration-data/
 *   2. Ensure the target PostgreSQL database is migrated and has at least one SUPER_ADMIN user.
 *   3. Create Venue records for each unique venue in nightpilot before running.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, EventSource, EventStatus } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');
const DATA_DIR = path.join(__dirname, 'migration-data');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJson(filename: string): unknown[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ ${filename} not found — skipping`);
    return [];
  }
  return fs
    .readFileSync(filePath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

/** Normalise Swiss phone numbers to +41XXXXXXXXX format (best-effort). */
function normalisePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[\s\-().+]/g, '');
  if (digits.startsWith('41') && digits.length === 11) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+41${digits.slice(1)}`;
  if (digits.length === 9) return `+41${digits}`;
  return raw.trim() || null;
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let attempt = 0;
  while (true) {
    const existing = await prisma.event.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    attempt++;
    candidate = `${base}-${attempt}`;
  }
}

// ---------------------------------------------------------------------------
// Phase 1: Migrate Events
// ---------------------------------------------------------------------------

async function migrateEvents(systemUserId: string): Promise<Map<string, string>> {
  const mongoIdToEventId = new Map<string, string>();
  const records = readJson('nightpilot_events.json') as Record<string, unknown>[];
  let created = 0;
  const skipped = 0;

  console.log(`\nMigrating ${records.length} events…`);

  for (const rec of records) {
    const mongoId = (rec._id as { $oid?: string })?.$oid ?? String(rec._id);
    const name = String(rec.name ?? rec.title ?? 'Untitled');
    const rawDate = rec.date ?? rec.eventDate ?? rec.start_date;
    const date = rawDate ? new Date(String(rawDate)) : new Date();
    const venueSlug = rec.venueSlug ?? rec.venue_slug ?? rec.venue;
    const djNames = Array.isArray(rec.djNames) ? (rec.djNames as string[]) : [];

    // Try to find linked venue
    let venueId: string | undefined;
    if (venueSlug) {
      const venue = await prisma.venue.findUnique({
        where: { slug: String(venueSlug) },
        select: { id: true },
      });
      venueId = venue?.id;
    }

    const slug = await uniqueSlug(toSlug(`${name}-${date.toISOString().slice(0, 10)}`));

    if (DRY_RUN) {
      console.log(`  [DRY] Event: "${name}" slug=${slug} date=${date.toISOString().slice(0,10)}`);
      mongoIdToEventId.set(mongoId, `dry-${mongoId}`);
      created++;
      continue;
    }

    const event = await prisma.event.create({
      data: {
        name,
        slug,
        date,
        startTime: rec.startTime ? String(rec.startTime) : null,
        endTime: rec.endTime ? String(rec.endTime) : null,
        description: rec.description ? String(rec.description) : null,
        djNames,
        genre: rec.genre ? String(rec.genre) : null,
        label: rec.label ? String(rec.label) : null,
        flyerImage: rec.flyerImage ?? rec.flyer_image ?? rec.imageUrl
          ? String(rec.flyerImage ?? rec.flyer_image ?? rec.imageUrl)
          : null,
        source: 'INTERNAL' as EventSource,
        status: 'PUBLISHED' as EventStatus,
        createdByUserId: systemUserId,
        ...(venueId ? { venueId } : {}),
      },
    });

    mongoIdToEventId.set(mongoId, event.id);
    created++;
  }

  console.log(`  ✓ Events: ${created} created, ${skipped} skipped`);
  return mongoIdToEventId;
}

// ---------------------------------------------------------------------------
// Phase 2: Migrate LoungeReservations
// ---------------------------------------------------------------------------

async function migrateLoungeReservations(mongoIdToEventId: Map<string, string>): Promise<void> {
  const records = readJson('nightpilot_loungereservations.json') as Record<string, unknown>[];
  let created = 0;
  let skipped = 0;

  console.log(`\nMigrating ${records.length} lounge reservations…`);

  for (const rec of records) {
    const mongoEventId = (rec.event as { $oid?: string })?.$oid ?? String(rec.event ?? rec.eventId ?? '');
    const eventId = mongoIdToEventId.get(mongoEventId);

    if (!eventId || eventId.startsWith('dry-')) {
      skipped++;
      continue;
    }

    // Look up venueId via the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { venueId: true },
    });
    const venueId = event?.venueId;

    if (!venueId) {
      console.warn(`  ⚠ No venueId for event ${eventId} — skipping lounge reservation`);
      skipped++;
      continue;
    }

    const rawNumbers = rec.loungeNumber ?? rec.loungeNumbers ?? [];
    const loungeNumbers = Array.isArray(rawNumbers)
      ? (rawNumbers as unknown[]).map(Number).filter((n) => !isNaN(n))
      : [];

    const arrivalTime = rec.arrivalTime ? String(rec.arrivalTime) : '22:00';
    const numberOfGuests = Number(rec.numberOfGuests ?? rec.guests ?? 1);
    const minConsumation = Number(rec.minConsumation ?? rec.min_consumation ?? 0);

    if (DRY_RUN) {
      console.log(`  [DRY] LoungeReservation eventId=${eventId} guests=${numberOfGuests}`);
      created++;
      continue;
    }

    await prisma.loungeReservation.create({
      data: {
        eventId,
        venueId,
        firstName: String(rec.fname ?? rec.firstName ?? 'Unknown'),
        lastName: String(rec.lname ?? rec.lastName ?? ''),
        phone: normalisePhone(String(rec.tel ?? rec.phone ?? '')) ?? '',
        arrivalTime,
        numberOfGuests,
        loungeNumbers,
        minConsumation,
        comments: rec.comments ? String(rec.comments) : null,
        status: 'CONFIRMED',
      },
    });
    created++;
  }

  console.log(`  ✓ Lounge reservations: ${created} created, ${skipped} skipped`);
}

// ---------------------------------------------------------------------------
// Phase 3: Migrate Guests
// ---------------------------------------------------------------------------

async function migrateGuests(mongoIdToEventId: Map<string, string>): Promise<void> {
  const records = readJson('nightpilot_guests.json') as Record<string, unknown>[];
  let created = 0;
  let skipped = 0;

  console.log(`\nMigrating ${records.length} guests…`);

  for (const rec of records) {
    const mongoEventId = (rec.event as { $oid?: string })?.$oid ?? String(rec.event ?? rec.eventId ?? '');
    const eventId = mongoIdToEventId.get(mongoEventId);

    if (!eventId || eventId.startsWith('dry-')) {
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [DRY] Guest: ${rec.fname} ${rec.lname} eventId=${eventId}`);
      created++;
      continue;
    }

    await prisma.guest.create({
      data: {
        eventId,
        firstName: String(rec.fname ?? rec.firstName ?? 'Unknown'),
        lastName: String(rec.lname ?? rec.lastName ?? ''),
        email: rec.email ? String(rec.email) : null,
        phone: normalisePhone(String(rec.tel ?? rec.phone ?? '')) ?? null,
        plusOnesCount: Number(rec.plusOnes ?? rec.plusOnesCount ?? 0),
        note: rec.note ? String(rec.note) : null,
      },
    });
    created++;
  }

  console.log(`  ✓ Guests: ${created} created, ${skipped} skipped`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n=== Nightpilot → PostgreSQL Migration ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  const systemUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    select: { id: true },
  });
  if (!systemUser) {
    throw new Error('No SUPER_ADMIN user found. Create one before running migration.');
  }
  console.log(`Using system user: ${systemUser.id}`);

  const mongoIdToEventId = await migrateEvents(systemUser.id);
  await migrateLoungeReservations(mongoIdToEventId);
  await migrateGuests(mongoIdToEventId);

  console.log('\n=== Migration complete ===\n');
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
