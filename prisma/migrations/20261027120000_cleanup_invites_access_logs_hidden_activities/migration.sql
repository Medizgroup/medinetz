-- DropForeignKey
ALTER TABLE "organization_invites" DROP CONSTRAINT "organization_invites_invited_by_fkey";

-- DropForeignKey
ALTER TABLE "organization_invites" DROP CONSTRAINT "organization_invites_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_join_requests" DROP CONSTRAINT "organization_join_requests_decided_by_fkey";

-- DropForeignKey
ALTER TABLE "organization_join_requests" DROP CONSTRAINT "organization_join_requests_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "organization_join_requests" DROP CONSTRAINT "organization_join_requests_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "organization_invites";

-- DropTable
DROP TABLE "organization_join_requests";

-- DropTable
DROP TABLE "patient_access_logs";

-- DropEnum
DROP TYPE "JoinRequestStatus";

-- CreateTable
CREATE TABLE "hidden_activities" (
    "user_id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hidden_activities_pkey" PRIMARY KEY ("user_id","activity_id")
);

-- CreateIndex
CREATE INDEX "hidden_activities_activity_id_idx" ON "hidden_activities"("activity_id");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- AddForeignKey
ALTER TABLE "hidden_activities" ADD CONSTRAINT "hidden_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidden_activities" ADD CONSTRAINT "hidden_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Inaktive Konten dürfen keine Session haben (siehe lib/auth.ts). Bisher
-- wurde nach der Registrierung automatisch eingeloggt — diese Sessions
-- gewährten trotz fehlender Freischaltung Zugriff auf die API.
DELETE FROM "sessions" WHERE "user_id" IN (SELECT "id" FROM "users" WHERE "is_active" = false);
