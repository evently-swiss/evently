-- CreateTable
CREATE TABLE "FeaturedEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT NOT NULL,
    "paidByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedEvent_eventId_key" ON "FeaturedEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedEvent_stripePaymentIntentId_key" ON "FeaturedEvent"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "FeaturedEvent_eventId_idx" ON "FeaturedEvent"("eventId");

-- CreateIndex
CREATE INDEX "FeaturedEvent_expiresAt_idx" ON "FeaturedEvent"("expiresAt");

-- AddForeignKey
ALTER TABLE "FeaturedEvent" ADD CONSTRAINT "FeaturedEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedEvent" ADD CONSTRAINT "FeaturedEvent_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
