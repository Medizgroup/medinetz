/*
  Warnings:

  - The `content` column on the `protocol_comments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `protocols` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "protocol_comments" ADD COLUMN     "content_text" TEXT,
DROP COLUMN "content",
ADD COLUMN     "content" JSON;

-- AlterTable
ALTER TABLE "protocols" ADD COLUMN     "description_text" TEXT,
DROP COLUMN "description",
ADD COLUMN     "description" JSON;
