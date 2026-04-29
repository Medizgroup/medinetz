-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'DIVERSE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ResidenceStatus" AS ENUM ('UNDOCUMENTED', 'ASYLUM_PROCESS', 'TOLERATED', 'RECOGNIZED', 'EU_CITIZEN_NO_INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "InsuranceStatus" AS ENUM ('NONE', 'BG', 'KSCHG', 'OTHER');

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "patient_id" TEXT;

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "pseudonym" TEXT NOT NULL,
    "birth_year" INTEGER,
    "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
    "country_of_origin" TEXT,
    "primary_language" TEXT,
    "postal_code_prefix" TEXT,
    "residence_status" "ResidenceStatus" NOT NULL DEFAULT 'OTHER',
    "insurance_status" "InsuranceStatus" NOT NULL DEFAULT 'NONE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icd_code" TEXT,
    "diagnosed_at" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "prescribed_at" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_access_logs" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "context_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_pseudonym_key" ON "patients"("pseudonym");

-- CreateIndex
CREATE INDEX "patients_pseudonym_idx" ON "patients"("pseudonym");

-- CreateIndex
CREATE INDEX "patients_deleted_at_idx" ON "patients"("deleted_at");

-- CreateIndex
CREATE INDEX "patients_gender_idx" ON "patients"("gender");

-- CreateIndex
CREATE INDEX "patients_residence_status_idx" ON "patients"("residence_status");

-- CreateIndex
CREATE INDEX "diagnoses_patient_id_idx" ON "diagnoses"("patient_id");

-- CreateIndex
CREATE INDEX "diagnoses_icd_code_idx" ON "diagnoses"("icd_code");

-- CreateIndex
CREATE INDEX "diagnoses_is_active_idx" ON "diagnoses"("is_active");

-- CreateIndex
CREATE INDEX "medications_patient_id_idx" ON "medications"("patient_id");

-- CreateIndex
CREATE INDEX "medications_is_active_idx" ON "medications"("is_active");

-- CreateIndex
CREATE INDEX "patient_access_logs_patient_id_created_at_idx" ON "patient_access_logs"("patient_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "patient_access_logs_user_id_created_at_idx" ON "patient_access_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "cases_patient_id_idx" ON "cases"("patient_id");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnoses" ADD CONSTRAINT "diagnoses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
