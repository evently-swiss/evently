-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "checkedInCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "checkedOutCount" INTEGER;
