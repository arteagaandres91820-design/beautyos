-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
    "phone" TEXT,
    "avatar" TEXT,
    "workDays" TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]',
    "weeklySchedule" TEXT NOT NULL DEFAULT '',
    "commissionPct" REAL NOT NULL DEFAULT 0,
    "monthlyGoal" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "businessId" TEXT NOT NULL,
    CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatar", "businessId", "commissionPct", "createdAt", "email", "id", "name", "password", "phone", "role", "updatedAt", "weeklySchedule", "workDays") SELECT "avatar", "businessId", "commissionPct", "createdAt", "email", "id", "name", "password", "phone", "role", "updatedAt", "weeklySchedule", "workDays" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
