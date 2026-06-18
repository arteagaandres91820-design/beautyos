-- CreateTable
CREATE TABLE "ClientPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionsTotal" INTEGER NOT NULL,
    "sessionsUsed" INTEGER NOT NULL DEFAULT 0,
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "notes" TEXT,
    "clientId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    CONSTRAINT "ClientPackage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientPackage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ServicePackage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientPackage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
