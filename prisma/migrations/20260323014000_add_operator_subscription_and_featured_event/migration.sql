-- Create enum for operator subscription lifecycle.
CREATE TYPE "OperatorSubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'CANCELED');

-- Create operator subscriptions linked to platform users.
CREATE TABLE "OperatorSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "status" "OperatorSubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  "planId" TEXT NOT NULL,
  "periodEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperatorSubscription_pkey" PRIMARY KEY ("id")
);

-- Create featured event purchases linked to events and users.
CREATE TABLE "FeaturedEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "stripePaymentIntentId" TEXT NOT NULL,
  "featuredUntil" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeaturedEvent_pkey" PRIMARY KEY ("id")
);

-- Unique constraints.
CREATE UNIQUE INDEX "OperatorSubscription_stripeCustomerId_key" ON "OperatorSubscription"("stripeCustomerId");
CREATE UNIQUE INDEX "OperatorSubscription_stripeSubscriptionId_key" ON "OperatorSubscription"("stripeSubscriptionId");
CREATE UNIQUE INDEX "FeaturedEvent_stripePaymentIntentId_key" ON "FeaturedEvent"("stripePaymentIntentId");

-- Lookup indexes.
CREATE INDEX "OperatorSubscription_userId_idx" ON "OperatorSubscription"("userId");
CREATE INDEX "FeaturedEvent_eventId_idx" ON "FeaturedEvent"("eventId");
CREATE INDEX "FeaturedEvent_userId_idx" ON "FeaturedEvent"("userId");
CREATE INDEX "FeaturedEvent_featuredUntil_idx" ON "FeaturedEvent"("featuredUntil");

-- Foreign keys.
ALTER TABLE "OperatorSubscription"
  ADD CONSTRAINT "OperatorSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeaturedEvent"
  ADD CONSTRAINT "FeaturedEvent_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeaturedEvent"
  ADD CONSTRAINT "FeaturedEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
