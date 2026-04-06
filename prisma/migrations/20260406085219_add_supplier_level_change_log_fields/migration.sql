-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SupplierLevelChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "oldLevel" TEXT NOT NULL,
    "newLevel" TEXT NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "changeType" TEXT NOT NULL DEFAULT 'manual',
    "quarter" TEXT,
    "prevAvgScore" REAL,
    "nextAvgScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierLevelChangeLog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SupplierLevelChangeLog" ("changeReason", "changedBy", "createdAt", "id", "newLevel", "oldLevel", "supplierId") SELECT "changeReason", "changedBy", "createdAt", "id", "newLevel", "oldLevel", "supplierId" FROM "SupplierLevelChangeLog";
DROP TABLE "SupplierLevelChangeLog";
ALTER TABLE "new_SupplierLevelChangeLog" RENAME TO "SupplierLevelChangeLog";
CREATE INDEX "SupplierLevelChangeLog_supplierId_idx" ON "SupplierLevelChangeLog"("supplierId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
