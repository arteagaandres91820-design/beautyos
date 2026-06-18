-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "logo" TEXT,
    "whatsapp" TEXT,
    "openTime" TEXT NOT NULL DEFAULT '09:00',
    "closeTime" TEXT NOT NULL DEFAULT '18:00',
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "closedDays" TEXT NOT NULL DEFAULT '[0]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Business" ("address", "city", "closeTime", "closedDays", "createdAt", "email", "id", "logo", "name", "openTime", "phone", "slotDuration", "updatedAt", "whatsapp") SELECT "address", "city", "closeTime", "closedDays", "createdAt", "email", "id", "logo", "name", "openTime", "phone", "slotDuration", "updatedAt", "whatsapp" FROM "Business";
DROP TABLE "Business";
ALTER TABLE "new_Business" RENAME TO "Business";
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
CREATE UNIQUE INDEX "Business_email_key" ON "Business"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
