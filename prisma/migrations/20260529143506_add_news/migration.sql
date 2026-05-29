-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('RELEASE', 'BUGFIX', 'UPDATE', 'NEWS', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "NewsBadge" AS ENUM ('UI', 'UX', 'ADMIN', 'API', 'SECURITY', 'GENERAL');

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "badge" "NewsBadge",
    "readMore" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "News_createdAt_idx" ON "News"("createdAt");
