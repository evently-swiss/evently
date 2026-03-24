import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Auth: Bearer <SCRAPER_API_KEY>
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const scraperKey = process.env.SCRAPER_API_KEY;

  if (!scraperKey || token !== scraperKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    externalUid,
    venueSlug,
    title,
    date,
    startTime,
    endTime,
    eventUrl,
    imageUrl,
    cost,
    tags,
  } = body as Record<string, unknown>;

  if (!externalUid || !venueSlug || !title || !date) {
    return NextResponse.json(
      { error: "Missing required fields: externalUid, venueSlug, title, date" },
      { status: 422 }
    );
  }

  const parsedDate = new Date(date as string);
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 422 });
  }

  const scrapedEvent = await prisma.scrapedEvent.upsert({
    where: { externalUid: externalUid as string },
    update: {
      venueSlug: venueSlug as string,
      title: title as string,
      date: parsedDate,
      startTime: (startTime as string | undefined) ?? null,
      endTime: (endTime as string | undefined) ?? null,
      eventUrl: (eventUrl as string | undefined) ?? null,
      imageUrl: (imageUrl as string | undefined) ?? null,
      cost: (cost as string | undefined) ?? null,
      tags: Array.isArray(tags) ? (tags as string[]) : [],
      scrapedAt: new Date(),
    },
    create: {
      externalUid: externalUid as string,
      venueSlug: venueSlug as string,
      title: title as string,
      date: parsedDate,
      startTime: (startTime as string | undefined) ?? null,
      endTime: (endTime as string | undefined) ?? null,
      eventUrl: (eventUrl as string | undefined) ?? null,
      imageUrl: (imageUrl as string | undefined) ?? null,
      cost: (cost as string | undefined) ?? null,
      tags: Array.isArray(tags) ? (tags as string[]) : [],
    },
  });

  return NextResponse.json(scrapedEvent, { status: 200 });
}
