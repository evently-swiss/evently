-- CreateTable
CREATE TABLE "_DoorStaffEvents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DoorStaffEvents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DoorStaffEvents_B_index" ON "_DoorStaffEvents"("B");

-- AddForeignKey
ALTER TABLE "_DoorStaffEvents" ADD CONSTRAINT "_DoorStaffEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DoorStaffEvents" ADD CONSTRAINT "_DoorStaffEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
