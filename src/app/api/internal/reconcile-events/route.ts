import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

export async function POST(req: NextRequest) {
  // Auth: same scraper bearer token
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const scraperKey = process.env.SCRAPER_API_KEY;

  if (!scraperKey || token !== scraperKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve a system user to assign scraped events to (first SUPER_ADMIN)
  const systemUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    select: { id: true },
  });
  if (!systemUser) {
    return NextResponse.json(
      { error: 'No SUPER_ADMIN user found to assign scraped events to' },
      { status: 500 },
    );
  }

  // Fetch all NEW scraped events
  const newScraped = await prisma.scrapedEvent.findMany({
    where: { syncStatus: 'NEW' },
    orderBy: { scrapedAt: 'asc' },
  });

  const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

  for (const scraped of newScraped) {
    try {
      // Look up venue by slug
      const venue = await prisma.venue.findUnique({
        where: { slug: scraped.venueSlug },
        select: { id: true },
      });

      // Check if an Event already linked to this scrapedEventId exists
      const existingEvent = await prisma.event.findUnique({
        where: { scrapedEventId: scraped.externalUid },
        select: { id: true },
      });

      if (existingEvent) {
        // Update existing event
        await prisma.event.update({
          where: { id: existingEvent.id },
          data: {
            name: scraped.title,
            date: scraped.date,
            startTime: scraped.startTime,
            endTime: scraped.endTime,
            flyerImage: scraped.imageUrl,
            ...(venue ? { venueId: venue.id } : {}),
          },
        });
        await prisma.scrapedEvent.update({
          where: { id: scraped.id },
          data: { syncStatus: 'RECONCILED', checkedAt: new Date() },
        });
        results.updated++;
      } else {
        // Create new event
        const baseSlug = toSlug(`${scraped.title}-${scraped.date.toISOString().slice(0, 10)}`);
        const slug = await uniqueSlug(baseSlug);

        await prisma.event.create({
          data: {
            name: scraped.title,
            slug,
            date: scraped.date,
            startTime: scraped.startTime,
            endTime: scraped.endTime,
            flyerImage: scraped.imageUrl,
            source: 'SCRAPED',
            scrapedEventId: scraped.externalUid,
            status: 'DRAFT',
            createdByUserId: systemUser.id,
            ...(venue ? { venueId: venue.id } : {}),
          },
        });
        await prisma.scrapedEvent.update({
          where: { id: scraped.id },
          data: { syncStatus: 'RECONCILED', checkedAt: new Date() },
        });
        results.created++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.errors.push(`${scraped.externalUid}: ${msg}`);
      results.skipped++;
    }
  }

  return NextResponse.json({ ...results, total: newScraped.length });
}
