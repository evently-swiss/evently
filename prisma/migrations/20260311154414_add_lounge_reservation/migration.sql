-- CreateTable
CREATE TABLE "Lounge" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tableNumbers" TEXT[],
    "arrivalTime" TEXT,
    "minConsumation" DOUBLE PRECISION,
    "numberOfGuests" INTEGER NOT NULL,
    "guestId" TEXT,

    CONSTRAINT "Lounge_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Lounge" ADD CONSTRAINT "Lounge_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lounge" ADD CONSTRAINT "Lounge_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

