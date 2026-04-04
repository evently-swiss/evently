-- Create enum for event source provenance
CREATE TYPE "EventSource" AS ENUM ('INTERNAL', 'SCRAPED');

-- Extend Event with source + richer metadata
ALTER TABLE "Event"
ADD COLUMN "source" "EventSource" NOT NULL DEFAULT 'INTERNAL',
ADD COLUMN "scrapedEventId" TEXT,
ADD COLUMN "djNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "genre" TEXT,
ADD COLUMN "label" TEXT,
ADD COLUMN "flyerImage" TEXT,
ADD COLUMN "titleImage" TEXT;

-- Ensure one internal Event per scraped upstream event when linked
CREATE UNIQUE INDEX "Event_scrapedEventId_key" ON "Event"("scrapedEventId");
