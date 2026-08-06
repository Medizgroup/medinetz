-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventRecurrence" ADD VALUE 'DAILY';
ALTER TYPE "EventRecurrence" ADD VALUE 'YEARLY';

-- CreateTable
CREATE TABLE "event_exceptions" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "original_starts_at" TIMESTAMP(3) NOT NULL,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "description" TEXT,
    "location" TEXT,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "all_day" BOOLEAN,
    "color" "EventColor",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_exceptions_event_id_idx" ON "event_exceptions"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_exceptions_event_id_original_starts_at_key" ON "event_exceptions"("event_id", "original_starts_at");

-- AddForeignKey
ALTER TABLE "event_exceptions" ADD CONSTRAINT "event_exceptions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
