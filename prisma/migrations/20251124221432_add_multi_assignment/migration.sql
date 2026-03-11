/*
  Warnings:

  - You are about to drop the column `promoterId` on the `SignupLink` table. All the data in the column will be lost.

*/

-- CreateTable: Create the many-to-many relationship table first
CREATE TABLE "_AssignedPromoters" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssignedPromoters_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AssignedPromoters_B_index" ON "_AssignedPromoters"("B");

-- AddForeignKey
ALTER TABLE "_AssignedPromoters" ADD CONSTRAINT "_AssignedPromoters_A_fkey" FOREIGN KEY ("A") REFERENCES "SignupLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssignedPromoters" ADD CONSTRAINT "_AssignedPromoters_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data: Copy existing promoterId relationships to new table
INSERT INTO "_AssignedPromoters" ("A", "B")
SELECT "id", "promoterId" 
FROM "SignupLink" 
WHERE "promoterId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "SignupLink" DROP CONSTRAINT "SignupLink_promoterId_fkey";

-- AlterTable: Drop the old column
ALTER TABLE "SignupLink" DROP COLUMN "promoterId";
