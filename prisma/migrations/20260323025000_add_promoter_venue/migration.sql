-- Create enum for promoter-venue role assignment
CREATE TYPE "PromoterVenueRole" AS ENUM ('RESIDENT', 'GUEST');

-- Create join table linking promoters to venues
CREATE TABLE "PromoterVenue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "role" "PromoterVenueRole" NOT NULL DEFAULT 'GUEST',
    "since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoterVenue_pkey" PRIMARY KEY ("id")
);

-- Enforce one promoter assignment per venue
CREATE UNIQUE INDEX "PromoterVenue_userId_venueId_key" ON "PromoterVenue"("userId", "venueId");
CREATE INDEX "PromoterVenue_userId_idx" ON "PromoterVenue"("userId");
CREATE INDEX "PromoterVenue_venueId_idx" ON "PromoterVenue"("venueId");

-- Foreign key constraints
ALTER TABLE "PromoterVenue"
ADD CONSTRAINT "PromoterVenue_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PromoterVenue"
ADD CONSTRAINT "PromoterVenue_venueId_fkey"
FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
