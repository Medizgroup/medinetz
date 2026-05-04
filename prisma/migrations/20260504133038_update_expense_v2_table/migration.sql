-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "is_paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT;
