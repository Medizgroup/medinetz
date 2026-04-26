/*
  Warnings:

  - The `content` column on the `case_comments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "case_comments" ADD COLUMN     "content_text" TEXT,
DROP COLUMN "content",
ADD COLUMN     "content" JSON;
