-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED', 'WAITLISTED');

-- AlterTable
ALTER TABLE "Guest"
ADD COLUMN "rsvpStatus" "RsvpStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "inviteToken" TEXT,
ADD COLUMN "invitedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_inviteToken_key" ON "Guest"("inviteToken");
