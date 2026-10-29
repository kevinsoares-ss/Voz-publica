-- AlterTable
ALTER TABLE "Commitment" ADD COLUMN "deadline" DATETIME;

-- CreateTable
CREATE TABLE "GovernmentAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "representativeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "evidenceUrl" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GovernmentAction_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "Representative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GovernmentAction_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Representative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceNamespace" TEXT NOT NULL DEFAULT 'camara',
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "civilName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'FEDERAL_DEPUTY',
    "sphere" TEXT NOT NULL DEFAULT 'FEDERAL',
    "powerBranch" TEXT NOT NULL DEFAULT 'LEGISLATIVE',
    "party" TEXT,
    "state" TEXT,
    "city" TEXT,
    "photoUrl" TEXT,
    "lastSyncedAt" DATETIME NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Representative_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Representative" ("createdAt", "externalId", "id", "lastSyncedAt", "name", "party", "photoUrl", "sourceId", "sourceNamespace", "state", "updatedAt") SELECT "createdAt", "externalId", "id", "lastSyncedAt", "name", "party", "photoUrl", "sourceId", "sourceNamespace", "state", "updatedAt" FROM "Representative";
DROP TABLE "Representative";
ALTER TABLE "new_Representative" RENAME TO "Representative";
CREATE INDEX "Representative_name_idx" ON "Representative"("name");
CREATE INDEX "Representative_state_party_idx" ON "Representative"("state", "party");
CREATE INDEX "Representative_role_sphere_state_city_idx" ON "Representative"("role", "sphere", "state", "city");
CREATE UNIQUE INDEX "Representative_sourceNamespace_externalId_key" ON "Representative"("sourceNamespace", "externalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "GovernmentAction_representativeId_eventDate_idx" ON "GovernmentAction"("representativeId", "eventDate");

-- CreateIndex
CREATE INDEX "GovernmentAction_type_eventDate_idx" ON "GovernmentAction"("type", "eventDate");
