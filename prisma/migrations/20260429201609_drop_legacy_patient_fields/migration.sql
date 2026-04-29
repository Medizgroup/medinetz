/*
  Warnings:

  - You are about to drop the column `patient_language` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `patient_notes` on the `cases` table. All the data in the column will be lost.
  - You are about to drop the column `patient_pseudonym` on the `cases` table. All the data in the column will be lost.
  - Made the column `patient_id` on table `cases` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "cases" DROP CONSTRAINT "cases_patient_id_fkey";

-- DropIndex
DROP INDEX "cases_patient_pseudonym_idx";

-- AlterTable
ALTER TABLE "cases" DROP COLUMN "patient_language",
DROP COLUMN "patient_notes",
DROP COLUMN "patient_pseudonym",
ALTER COLUMN "patient_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
