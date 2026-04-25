-- DropForeignKey
ALTER TABLE "mentions" DROP CONSTRAINT "mentions_case_comment_target_id_fkey";

-- DropForeignKey
ALTER TABLE "mentions" DROP CONSTRAINT "mentions_protocol_comment_target_id_fkey";

-- AlterTable
ALTER TABLE "mentions" ADD COLUMN     "case_comment_id" TEXT,
ADD COLUMN     "protocol_comment_id" TEXT,
ADD COLUMN     "protocol_id" TEXT;

-- CreateIndex
CREATE INDEX "mentions_mentioned_user_id_created_at_idx" ON "mentions"("mentioned_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "mentions_protocol_id_idx" ON "mentions"("protocol_id");

-- CreateIndex
CREATE INDEX "mentions_case_comment_id_idx" ON "mentions"("case_comment_id");

-- CreateIndex
CREATE INDEX "mentions_protocol_comment_id_idx" ON "mentions"("protocol_comment_id");

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_case_comment_id_fkey" FOREIGN KEY ("case_comment_id") REFERENCES "case_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_protocol_comment_id_fkey" FOREIGN KEY ("protocol_comment_id") REFERENCES "protocol_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
