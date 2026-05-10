ALTER TABLE "todos" ADD COLUMN "creator_id"   TEXT;
ALTER TABLE "todos" ADD COLUMN "assignee_id"  TEXT;
ALTER TABLE "todos" ADD COLUMN "completed_by" TEXT;
ALTER TABLE "todos" ADD COLUMN "updated_at"   TIMESTAMP(3);

UPDATE "todos" SET
  "creator_id"  = "user_id",
  "assignee_id" = "user_id",
  "updated_at"  = "created_at";

ALTER TABLE "todos" ALTER COLUMN "creator_id" SET NOT NULL;
ALTER TABLE "todos" ALTER COLUMN "updated_at" SET NOT NULL;

ALTER TABLE "todos" DROP CONSTRAINT "todos_user_id_fkey";
DROP INDEX IF EXISTS "todos_user_id_idx";
DROP INDEX IF EXISTS "todos_user_id_done_idx";
ALTER TABLE "todos" DROP COLUMN "user_id";

CREATE INDEX "todos_creator_id_idx"        ON "todos"("creator_id");
CREATE INDEX "todos_assignee_id_idx"       ON "todos"("assignee_id");
CREATE INDEX "todos_creator_id_done_idx"   ON "todos"("creator_id", "done");
CREATE INDEX "todos_assignee_id_done_idx"  ON "todos"("assignee_id", "done");

ALTER TABLE "todos" ADD CONSTRAINT "todos_creator_id_fkey"
  FOREIGN KEY ("creator_id")   REFERENCES "users"("id") ON DELETE CASCADE  ON UPDATE CASCADE;
ALTER TABLE "todos" ADD CONSTRAINT "todos_assignee_id_fkey"
  FOREIGN KEY ("assignee_id")  REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "todos" ADD CONSTRAINT "todos_completed_by_fkey"
  FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
