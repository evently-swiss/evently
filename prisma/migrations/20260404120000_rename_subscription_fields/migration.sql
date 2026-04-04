-- Rename OperatorSubscription.stripePriceId -> planId
ALTER TABLE "OperatorSubscription" RENAME COLUMN "stripePriceId" TO "planId";

-- Rename OperatorSubscription.currentPeriodEnd -> periodEnd, make nullable
ALTER TABLE "OperatorSubscription" RENAME COLUMN "currentPeriodEnd" TO "periodEnd";
ALTER TABLE "OperatorSubscription" ALTER COLUMN "periodEnd" DROP NOT NULL;

-- Drop OperatorSubscription.userId unique constraint (allow multiple subscriptions per user)
DROP INDEX "OperatorSubscription_userId_key";

-- Make stripeCustomerId and stripeSubscriptionId nullable
ALTER TABLE "OperatorSubscription" ALTER COLUMN "stripeCustomerId" DROP NOT NULL;
ALTER TABLE "OperatorSubscription" ALTER COLUMN "stripeSubscriptionId" DROP NOT NULL;

-- Add OperatorSubscriptionStatus enum and migrate status column
CREATE TYPE "OperatorSubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'CANCELED');
ALTER TABLE "OperatorSubscription"
  ALTER COLUMN "status" TYPE "OperatorSubscriptionStatus"
  USING CASE "status"
    WHEN 'trialing' THEN 'TRIALING'::"OperatorSubscriptionStatus"
    WHEN 'canceled' THEN 'CANCELED'::"OperatorSubscriptionStatus"
    ELSE 'ACTIVE'::"OperatorSubscriptionStatus"
  END;
ALTER TABLE "OperatorSubscription" ALTER COLUMN "status" SET DEFAULT 'TRIALING';

-- Rename FeaturedEvent.paidByUserId -> userId
ALTER TABLE "FeaturedEvent" RENAME COLUMN "paidByUserId" TO "userId";

-- Rename FeaturedEvent.expiresAt -> featuredUntil
ALTER TABLE "FeaturedEvent" RENAME COLUMN "expiresAt" TO "featuredUntil";

-- Drop FeaturedEvent.eventId unique constraint (allow multiple featured events per event)
DROP INDEX "FeaturedEvent_eventId_key";

-- Add new indexes for FeaturedEvent
CREATE INDEX "FeaturedEvent_userId_idx" ON "FeaturedEvent"("userId");
CREATE INDEX "FeaturedEvent_featuredUntil_idx" ON "FeaturedEvent"("featuredUntil");

-- Add User foreign key for FeaturedEvent.userId (replacing paidByUserId FK)
ALTER TABLE "FeaturedEvent" DROP CONSTRAINT "FeaturedEvent_paidByUserId_fkey";
ALTER TABLE "FeaturedEvent" ADD CONSTRAINT "FeaturedEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Change User default role from ADMIN to PROMOTER
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'PROMOTER';
