-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receipt_sent" BOOLEAN NOT NULL DEFAULT false;
