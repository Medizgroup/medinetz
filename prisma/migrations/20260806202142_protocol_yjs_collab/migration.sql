-- DropForeignKey
ALTER TABLE "protocol_presence" DROP CONSTRAINT "protocol_presence_protocol_id_fkey";

-- DropForeignKey
ALTER TABLE "protocol_presence" DROP CONSTRAINT "protocol_presence_user_id_fkey";

-- AlterTable
ALTER TABLE "protocols" ADD COLUMN     "ydoc_state" BYTEA;

-- DropTable
DROP TABLE "protocol_presence";
