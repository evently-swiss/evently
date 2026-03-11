-- DropForeignKey
ALTER TABLE "Guest" DROP CONSTRAINT "Guest_signupLinkId_fkey";

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "checkedOutAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "promoterId" TEXT,
ALTER COLUMN "signupLinkId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_signupLinkId_fkey" FOREIGN KEY ("signupLinkId") REFERENCES "SignupLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
