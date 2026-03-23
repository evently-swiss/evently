-- Create enum for lounge reservation lifecycle
CREATE TYPE "LoungeStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- Create lounge reservations table (ported from Nightpilot)
CREATE TABLE "LoungeReservation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "loungeNumbers" INTEGER[],
    "minConsumation" DECIMAL(10,2) NOT NULL,
    "comments" TEXT,
    "status" "LoungeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoungeReservation_pkey" PRIMARY KEY ("id")
);

-- Foreign key constraints
ALTER TABLE "LoungeReservation"
ADD CONSTRAINT "LoungeReservation_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LoungeReservation"
ADD CONSTRAINT "LoungeReservation_venueId_fkey"
FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
