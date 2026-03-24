-- DropIndex
DROP INDEX "Event_venueId_idx";

-- CreateTable
CREATE TABLE "OperatorSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorSubscription_userId_key" ON "OperatorSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorSubscription_stripeCustomerId_key" ON "OperatorSubscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorSubscription_stripeSubscriptionId_key" ON "OperatorSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "OperatorSubscription_userId_idx" ON "OperatorSubscription"("userId");

-- CreateIndex
CREATE INDEX "OperatorSubscription_stripeCustomerId_idx" ON "OperatorSubscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "OperatorSubscription_stripeSubscriptionId_idx" ON "OperatorSubscription"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "OperatorSubscription" ADD CONSTRAINT "OperatorSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
