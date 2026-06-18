-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BookingRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientEmail" TEXT,
    "date" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "serviceId" TEXT,
    "serviceIds" TEXT NOT NULL DEFAULT '[]',
    "businessId" TEXT NOT NULL,
    CONSTRAINT "BookingRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BookingRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BookingRequest" ("businessId", "clientEmail", "clientName", "clientPhone", "createdAt", "date", "id", "notes", "serviceId", "status", "timeSlot", "updatedAt") SELECT "businessId", "clientEmail", "clientName", "clientPhone", "createdAt", "date", "id", "notes", "serviceId", "status", "timeSlot", "updatedAt" FROM "BookingRequest";
DROP TABLE "BookingRequest";
ALTER TABLE "new_BookingRequest" RENAME TO "BookingRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
