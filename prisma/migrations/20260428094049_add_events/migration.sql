-- CreateEnum
CREATE TYPE "EventRecurrence" AS ENUM ('NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'ORGANIZATION', 'PRIVATE');

-- CreateEnum
CREATE TYPE "EventColor" AS ENUM ('SKY', 'AMBER', 'VIOLET', 'ROSE', 'EMERALD', 'ORANGE');

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "color" "EventColor" NOT NULL DEFAULT 'SKY',
    "visibility" "EventVisibility" NOT NULL DEFAULT 'ORGANIZATION',
    "recurrence" "EventRecurrence" NOT NULL DEFAULT 'NONE',
    "recurrence_end_date" DATE,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_organization_id_starts_at_idx" ON "events"("organization_id", "starts_at");

-- CreateIndex
CREATE INDEX "events_starts_at_idx" ON "events"("starts_at");

-- CreateIndex
CREATE INDEX "events_recurrence_idx" ON "events"("recurrence");

-- CreateIndex
CREATE INDEX "events_creator_id_idx" ON "events"("creator_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
