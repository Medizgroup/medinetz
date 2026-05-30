-- AlterTable
ALTER TABLE "protocols" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "protocol_presence" (
    "protocol_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_presence_pkey" PRIMARY KEY ("protocol_id","user_id")
);

-- CreateIndex
CREATE INDEX "protocol_presence_protocol_id_idx" ON "protocol_presence"("protocol_id");

-- AddForeignKey
ALTER TABLE "protocol_presence" ADD CONSTRAINT "protocol_presence_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_presence" ADD CONSTRAINT "protocol_presence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
