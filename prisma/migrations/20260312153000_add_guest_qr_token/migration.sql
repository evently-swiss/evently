-- AlterTable
ALTER TABLE "Guest" ADD COLUMN "qrToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Guest_qrToken_key" ON "Guest"("qrToken");
