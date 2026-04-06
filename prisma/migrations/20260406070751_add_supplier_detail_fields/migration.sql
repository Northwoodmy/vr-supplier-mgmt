-- AlterTable
ALTER TABLE "QualityReview" ADD COLUMN "animationSmoothnessNote" TEXT;
ALTER TABLE "QualityReview" ADD COLUMN "audioQualityNote" TEXT;
ALTER TABLE "QualityReview" ADD COLUMN "cameraWorkNote" TEXT;
ALTER TABLE "QualityReview" ADD COLUMN "confirmedAt" DATETIME;
ALTER TABLE "QualityReview" ADD COLUMN "confirmedBy" TEXT;
ALTER TABLE "QualityReview" ADD COLUMN "storyNoveltyNote" TEXT;
ALTER TABLE "QualityReview" ADD COLUMN "vfxMatchNote" TEXT;
ALTER TABLE "QualityReview" ADD COLUMN "visualQualityNote" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN "applicationId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "bankAccount" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "bankName" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "businessLicense" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "businessScope" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "companyName" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "coreMembers" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "creditRecord" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "equipment" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "establishedDate" DATETIME;
ALTER TABLE "Supplier" ADD COLUMN "legalRepresentative" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "levelChangeReason" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "levelUpdatedAt" DATETIME;
ALTER TABLE "Supplier" ADD COLUMN "registeredCapital" REAL;
ALTER TABLE "Supplier" ADD COLUMN "remarks" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "sampleWorks" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "taxType" TEXT;

-- AlterTable
ALTER TABLE "SupplierProject" ADD COLUMN "estimatedCost" REAL;
ALTER TABLE "SupplierProject" ADD COLUMN "finalCost" REAL;
ALTER TABLE "SupplierProject" ADD COLUMN "priceDeviation" REAL;

-- CreateTable
CREATE TABLE "SupplierApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "registeredCapital" REAL,
    "businessLicense" TEXT,
    "businessScope" TEXT,
    "teamSize" INTEGER,
    "coreMembers" TEXT,
    "engineCapability" TEXT,
    "equipment" TEXT,
    "financialReport" TEXT,
    "bankRating" TEXT,
    "creditRecord" TEXT,
    "recommendation" TEXT,
    "sampleWorks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "applicationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentReviewer" TEXT,
    "documentReviewAt" DATETIME,
    "documentReviewResult" TEXT,
    "documentComments" TEXT,
    "sampleReviewer" TEXT,
    "sampleReviewAt" DATETIME,
    "sampleScore" REAL,
    "sampleComments" TEXT,
    "siteVisitAt" DATETIME,
    "siteVisitResult" TEXT,
    "siteVisitComments" TEXT,
    "trialProjectId" TEXT,
    "trialProjectAt" DATETIME,
    "trialResult" TEXT,
    "trialComments" TEXT,
    "finalScore" REAL,
    "finalResult" TEXT,
    "rejectedReason" TEXT,
    "completedAt" DATETIME,
    "supplierId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupplierLevelChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "oldLevel" TEXT NOT NULL,
    "newLevel" TEXT NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierLevelChangeLog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectType" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "complexity" TEXT NOT NULL,
    "minPrice" REAL NOT NULL,
    "maxPrice" REAL NOT NULL,
    "avgPrice" REAL,
    "sampleCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SupplierTraining" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "trainer" TEXT,
    "trainingDate" DATETIME NOT NULL,
    "attendees" TEXT,
    "materials" TEXT,
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierTraining_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "last_login_at" DATETIME
);
INSERT INTO "new_User" ("avatar", "createdAt", "displayName", "email", "id", "last_login_at", "passwordHash", "status", "updatedAt", "username") SELECT "avatar", "createdAt", "displayName", "email", "id", "last_login_at", "passwordHash", "status", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SupplierApplication_status_idx" ON "SupplierApplication"("status");

-- CreateIndex
CREATE INDEX "SupplierApplication_applicationDate_idx" ON "SupplierApplication"("applicationDate");

-- CreateIndex
CREATE INDEX "SupplierLevelChangeLog_supplierId_idx" ON "SupplierLevelChangeLog"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectPrice_projectType_duration_complexity_key" ON "ProjectPrice"("projectType", "duration", "complexity");

-- CreateIndex
CREATE INDEX "SupplierTraining_supplierId_idx" ON "SupplierTraining"("supplierId");
