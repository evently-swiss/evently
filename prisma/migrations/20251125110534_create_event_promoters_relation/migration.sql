-- CreateTable
CREATE TABLE "_EventPromoters" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventPromoters_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EventPromoters_B_index" ON "_EventPromoters"("B");

-- AddForeignKey
ALTER TABLE "_EventPromoters" ADD CONSTRAINT "_EventPromoters_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventPromoters" ADD CONSTRAINT "_EventPromoters_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
