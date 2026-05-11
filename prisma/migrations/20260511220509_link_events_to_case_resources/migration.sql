/*
  Warnings:

  - A unique constraint covering the columns `[case_doctor_id]` on the table `events` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[case_interpreter_id]` on the table `events` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "case_doctor_id" TEXT,
ADD COLUMN     "case_interpreter_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "events_case_doctor_id_key" ON "events"("case_doctor_id");

-- CreateIndex
CREATE UNIQUE INDEX "events_case_interpreter_id_key" ON "events"("case_interpreter_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_case_doctor_id_fkey" FOREIGN KEY ("case_doctor_id") REFERENCES "case_doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_case_interpreter_id_fkey" FOREIGN KEY ("case_interpreter_id") REFERENCES "case_interpreters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
