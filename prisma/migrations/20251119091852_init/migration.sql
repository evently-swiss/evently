-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROMOTER', 'ENTRY_STAFF');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('GENERAL', 'PROMOTER', 'PERSONAL');

-- CreateEnum
CREATE TYPE "FieldMode" AS ENUM ('HIDDEN', 'OPTIONAL', 'REQUIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PROMOTER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "venueName" TEXT,
    "address" TEXT,
    "description" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "capacity" INTEGER,
    "logoUrl" TEXT,
    "heroImageUrl" TEXT,
    "accentColor" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignupLink" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "promoterId" TEXT,
    "type" "LinkType" NOT NULL DEFAULT 'GENERAL',
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "maxTotalGuests" INTEGER,
    "maxPlusOnesPerSignup" INTEGER NOT NULL DEFAULT 3,
    "singleUse" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "emailMode" "FieldMode" NOT NULL DEFAULT 'REQUIRED',
    "phoneMode" "FieldMode" NOT NULL DEFAULT 'OPTIONAL',
    "allowNotes" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignupLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "signupLinkId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "plusOnesCount" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "checkedInByUserId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SignupLink_slug_key" ON "SignupLink"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_guestId_key" ON "CheckIn"("guestId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignupLink" ADD CONSTRAINT "SignupLink_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignupLink" ADD CONSTRAINT "SignupLink_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_signupLinkId_fkey" FOREIGN KEY ("signupLinkId") REFERENCES "SignupLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_checkedInByUserId_fkey" FOREIGN KEY ("checkedInByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
