-- CreateTable
CREATE TABLE "LoungeLayout" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Main Floor',
    "width" INTEGER NOT NULL DEFAULT 1200,
    "height" INTEGER NOT NULL DEFAULT 800,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoungeLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoungeBox" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "shape" TEXT NOT NULL DEFAULT 'rect',
    "color" TEXT,
    "capacity" INTEGER,
    "minConsumation" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LoungeBox_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Event" ADD COLUMN "loungeLayoutId" TEXT;

-- CreateIndex
CREATE INDEX "LoungeLayout_venueId_idx" ON "LoungeLayout"("venueId");

-- CreateIndex
CREATE INDEX "LoungeBox_layoutId_idx" ON "LoungeBox"("layoutId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_loungeLayoutId_fkey" FOREIGN KEY ("loungeLayoutId") REFERENCES "LoungeLayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoungeLayout" ADD CONSTRAINT "LoungeLayout_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoungeBox" ADD CONSTRAINT "LoungeBox_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "LoungeLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
