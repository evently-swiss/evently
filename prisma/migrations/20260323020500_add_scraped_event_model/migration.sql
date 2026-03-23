-- Create enum for scraped event ingestion lifecycle
CREATE TYPE "ScrapedSyncStatus" AS ENUM ('NEW', 'RECONCILED', 'DUPLICATE', 'FAILED');

-- Create staging table for scraper-ingested events
CREATE TABLE "ScrapedEvent" (
    "id" TEXT NOT NULL,
    "externalUid" TEXT NOT NULL,
    "venueSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "eventUrl" TEXT,
    "imageUrl" TEXT,
    "cost" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "syncStatus" "ScrapedSyncStatus" NOT NULL DEFAULT 'NEW',
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapedEvent_pkey" PRIMARY KEY ("id")
);

-- Ensure upstream identity uniqueness
CREATE UNIQUE INDEX "ScrapedEvent_externalUid_key" ON "ScrapedEvent"("externalUid");

-- Link normalized events to scraped source payload when available
ALTER TABLE "Event"
ADD CONSTRAINT "Event_scrapedEventId_fkey"
FOREIGN KEY ("scrapedEventId") REFERENCES "ScrapedEvent"("externalUid") ON DELETE SET NULL ON UPDATE CASCADE;
