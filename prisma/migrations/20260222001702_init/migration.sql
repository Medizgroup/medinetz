-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LIMITED', 'VIEWER', 'COORDINATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'CLOSED');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('ROUTINE', 'PREGNANCY', 'MANAGEMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATED', 'UPDATED', 'COMMENTED', 'ASSIGNED', 'CLOSED', 'REOPENED', 'MENTIONED', 'ATTACHED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MENTION', 'ASSIGNMENT', 'COMMENT', 'CASE_UPDATE', 'PROTOCOL_UPDATE');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('DOCTOR', 'INTERPRETER', 'MEDICATION', 'LAB', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceAvailability" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "OrganizationType" NOT NULL DEFAULT 'CUSTOM',
    "color" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invited_by" TEXT,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invites" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "invited_by" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'de',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin',
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "default_organization_id" TEXT,
    "ui_settings" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,
    "languages" TEXT[],
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "practice_name" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "availability" "ResourceAvailability" DEFAULT 'MEDIUM',
    "accepts_new_patients" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interpreters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "languages" TEXT[],
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "availability" "ResourceAvailability" DEFAULT 'MEDIUM',
    "hourly_rate" DECIMAL(10,2),
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "interpreters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "color" TEXT,
    "organization_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "case_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CasePriority" NOT NULL DEFAULT 'MEDIUM',
    "sensitivity_level" INTEGER NOT NULL DEFAULT 1,
    "patient_pseudonym" TEXT NOT NULL,
    "patient_language" TEXT,
    "patient_notes" TEXT,
    "creator_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "closed_by" TEXT,
    "total_costs" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estimated_costs" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_comments" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_doctors" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "appointment_date" DATE,
    "appointment_notes" TEXT,
    "invoice_received" BOOLEAN NOT NULL DEFAULT false,
    "invoice_amount" DECIMAL(10,2),
    "invoice_date" DATE,
    "invoice_paid" BOOLEAN NOT NULL DEFAULT false,
    "diagnosis" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "case_doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_interpreters" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "interpreter_id" TEXT NOT NULL,
    "appointment_date" DATE,
    "hours_worked" DECIMAL(5,2),
    "cost" DECIMAL(10,2),
    "invoice_received" BOOLEAN NOT NULL DEFAULT false,
    "invoice_paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "case_interpreters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_costs" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "invoice_date" DATE,
    "invoice_paid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "case_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_watchers" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_watchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_labels" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_attachments" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocols" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "protocol_number" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_comments" (
    "id" TEXT NOT NULL,
    "protocol_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_cases" (
    "id" TEXT NOT NULL,
    "protocol_id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "donor_name" TEXT,
    "donation_date" DATE NOT NULL,
    "purpose" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "case_id" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "expense_date" DATE NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "planned_amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_reports" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "report_type" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "total_donations" DECIMAL(10,2),
    "total_expenses" DECIMAL(10,2),
    "case_count" INTEGER,
    "report_data" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by" TEXT NOT NULL,

    CONSTRAINT "financial_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT,
    "user_id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "target_type" TEXT,
    "target_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentions" (
    "id" TEXT NOT NULL,
    "mentioned_user_id" TEXT NOT NULL,
    "mentioning_user_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "todos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "due_date" DATE,
    "target_type" TEXT,
    "target_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_is_archived_idx" ON "organizations"("is_archived");

-- CreateIndex
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members"("organization_id");

-- CreateIndex
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");

-- CreateIndex
CREATE INDEX "organization_members_role_idx" ON "organization_members"("role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invites_token_key" ON "organization_invites"("token");

-- CreateIndex
CREATE INDEX "organization_invites_organization_id_email_idx" ON "organization_invites"("organization_id", "email");

-- CreateIndex
CREATE INDEX "organization_invites_token_idx" ON "organization_invites"("token");

-- CreateIndex
CREATE INDEX "doctors_specialty_idx" ON "doctors"("specialty");

-- CreateIndex
CREATE INDEX "doctors_is_active_idx" ON "doctors"("is_active");

-- CreateIndex
CREATE INDEX "doctors_languages_idx" ON "doctors"("languages");

-- CreateIndex
CREATE INDEX "doctors_tags_idx" ON "doctors"("tags");

-- CreateIndex
CREATE INDEX "interpreters_is_active_idx" ON "interpreters"("is_active");

-- CreateIndex
CREATE INDEX "interpreters_languages_idx" ON "interpreters"("languages");

-- CreateIndex
CREATE INDEX "interpreters_tags_idx" ON "interpreters"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "resource_tags_name_key" ON "resource_tags"("name");

-- CreateIndex
CREATE INDEX "resource_tags_type_idx" ON "resource_tags"("type");

-- CreateIndex
CREATE INDEX "resource_tags_organization_id_idx" ON "resource_tags"("organization_id");

-- CreateIndex
CREATE INDEX "cases_organization_id_status_idx" ON "cases"("organization_id", "status");

-- CreateIndex
CREATE INDEX "cases_organization_id_assignee_id_idx" ON "cases"("organization_id", "assignee_id");

-- CreateIndex
CREATE INDEX "cases_organization_id_created_at_idx" ON "cases"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_priority_idx" ON "cases"("priority");

-- CreateIndex
CREATE INDEX "cases_creator_id_idx" ON "cases"("creator_id");

-- CreateIndex
CREATE INDEX "cases_assignee_id_idx" ON "cases"("assignee_id");

-- CreateIndex
CREATE INDEX "cases_patient_pseudonym_idx" ON "cases"("patient_pseudonym");

-- CreateIndex
CREATE UNIQUE INDEX "cases_organization_id_case_number_key" ON "cases"("organization_id", "case_number");

-- CreateIndex
CREATE INDEX "case_comments_case_id_idx" ON "case_comments"("case_id");

-- CreateIndex
CREATE INDEX "case_comments_user_id_idx" ON "case_comments"("user_id");

-- CreateIndex
CREATE INDEX "case_comments_created_at_idx" ON "case_comments"("created_at");

-- CreateIndex
CREATE INDEX "case_doctors_case_id_idx" ON "case_doctors"("case_id");

-- CreateIndex
CREATE INDEX "case_doctors_doctor_id_idx" ON "case_doctors"("doctor_id");

-- CreateIndex
CREATE INDEX "case_doctors_invoice_paid_idx" ON "case_doctors"("invoice_paid");

-- CreateIndex
CREATE INDEX "case_interpreters_case_id_idx" ON "case_interpreters"("case_id");

-- CreateIndex
CREATE INDEX "case_interpreters_interpreter_id_idx" ON "case_interpreters"("interpreter_id");

-- CreateIndex
CREATE INDEX "case_interpreters_invoice_paid_idx" ON "case_interpreters"("invoice_paid");

-- CreateIndex
CREATE INDEX "case_costs_case_id_idx" ON "case_costs"("case_id");

-- CreateIndex
CREATE INDEX "case_costs_category_idx" ON "case_costs"("category");

-- CreateIndex
CREATE INDEX "case_costs_invoice_paid_idx" ON "case_costs"("invoice_paid");

-- CreateIndex
CREATE INDEX "case_watchers_user_id_idx" ON "case_watchers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "case_watchers_case_id_user_id_key" ON "case_watchers"("case_id", "user_id");

-- CreateIndex
CREATE INDEX "case_labels_case_id_idx" ON "case_labels"("case_id");

-- CreateIndex
CREATE INDEX "case_labels_label_idx" ON "case_labels"("label");

-- CreateIndex
CREATE INDEX "case_attachments_case_id_idx" ON "case_attachments"("case_id");

-- CreateIndex
CREATE INDEX "case_attachments_uploaded_by_idx" ON "case_attachments"("uploaded_by");

-- CreateIndex
CREATE INDEX "protocols_organization_id_idx" ON "protocols"("organization_id");

-- CreateIndex
CREATE INDEX "protocols_date_idx" ON "protocols"("date" DESC);

-- CreateIndex
CREATE INDEX "protocols_creator_id_idx" ON "protocols"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "protocols_organization_id_protocol_number_key" ON "protocols"("organization_id", "protocol_number");

-- CreateIndex
CREATE INDEX "protocol_comments_protocol_id_idx" ON "protocol_comments"("protocol_id");

-- CreateIndex
CREATE INDEX "protocol_comments_user_id_idx" ON "protocol_comments"("user_id");

-- CreateIndex
CREATE INDEX "protocol_comments_created_at_idx" ON "protocol_comments"("created_at");

-- CreateIndex
CREATE INDEX "protocol_cases_case_id_idx" ON "protocol_cases"("case_id");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_cases_protocol_id_case_id_key" ON "protocol_cases"("protocol_id", "case_id");

-- CreateIndex
CREATE INDEX "donations_organization_id_idx" ON "donations"("organization_id");

-- CreateIndex
CREATE INDEX "donations_donation_date_idx" ON "donations"("donation_date" DESC);

-- CreateIndex
CREATE INDEX "expenses_organization_id_idx" ON "expenses"("organization_id");

-- CreateIndex
CREATE INDEX "expenses_case_id_idx" ON "expenses"("case_id");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "budgets_organization_id_year_month_key" ON "budgets"("organization_id", "year", "month");

-- CreateIndex
CREATE INDEX "financial_reports_organization_id_idx" ON "financial_reports"("organization_id");

-- CreateIndex
CREATE INDEX "financial_reports_period_start_period_end_idx" ON "financial_reports"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "financial_reports_generated_at_idx" ON "financial_reports"("generated_at" DESC);

-- CreateIndex
CREATE INDEX "activities_organization_id_idx" ON "activities"("organization_id");

-- CreateIndex
CREATE INDEX "activities_user_id_idx" ON "activities"("user_id");

-- CreateIndex
CREATE INDEX "activities_target_type_idx" ON "activities"("target_type");

-- CreateIndex
CREATE INDEX "activities_target_id_idx" ON "activities"("target_id");

-- CreateIndex
CREATE INDEX "activities_created_at_idx" ON "activities"("created_at" DESC);

-- CreateIndex
CREATE INDEX "activities_organization_id_created_at_idx" ON "activities"("organization_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activities_user_id_created_at_idx" ON "activities"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "activities_target_type_target_id_idx" ON "activities"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_read_created_at_idx" ON "notifications"("user_id", "read", "created_at" DESC);

-- CreateIndex
CREATE INDEX "mentions_mentioned_user_id_idx" ON "mentions"("mentioned_user_id");

-- CreateIndex
CREATE INDEX "mentions_target_type_target_id_idx" ON "mentions"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "todos_user_id_idx" ON "todos"("user_id");

-- CreateIndex
CREATE INDEX "todos_done_idx" ON "todos"("done");

-- CreateIndex
CREATE INDEX "todos_due_date_idx" ON "todos"("due_date");

-- CreateIndex
CREATE INDEX "todos_user_id_done_idx" ON "todos"("user_id", "done");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interpreters" ADD CONSTRAINT "interpreters_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_comments" ADD CONSTRAINT "case_comments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_comments" ADD CONSTRAINT "case_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_doctors" ADD CONSTRAINT "case_doctors_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_doctors" ADD CONSTRAINT "case_doctors_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_doctors" ADD CONSTRAINT "case_doctors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_interpreters" ADD CONSTRAINT "case_interpreters_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_interpreters" ADD CONSTRAINT "case_interpreters_interpreter_id_fkey" FOREIGN KEY ("interpreter_id") REFERENCES "interpreters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_interpreters" ADD CONSTRAINT "case_interpreters_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_costs" ADD CONSTRAINT "case_costs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_costs" ADD CONSTRAINT "case_costs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_watchers" ADD CONSTRAINT "case_watchers_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_watchers" ADD CONSTRAINT "case_watchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_labels" ADD CONSTRAINT "case_labels_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_attachments" ADD CONSTRAINT "case_attachments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_attachments" ADD CONSTRAINT "case_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols" ADD CONSTRAINT "protocols_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_comments" ADD CONSTRAINT "protocol_comments_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_comments" ADD CONSTRAINT "protocol_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_cases" ADD CONSTRAINT "protocol_cases_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_cases" ADD CONSTRAINT "protocol_cases_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_mentioning_user_id_fkey" FOREIGN KEY ("mentioning_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_case_comment_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "case_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_protocol_comment_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "protocol_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
