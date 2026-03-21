-- AlterTable
ALTER TABLE "User"
ADD COLUMN "emailVerified" TIMESTAMP(3),
ADD COLUMN "verificationToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");
