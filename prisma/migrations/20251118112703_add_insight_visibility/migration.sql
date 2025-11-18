-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT,
    "question" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "horizon" DATETIME NOT NULL,
    "probability" REAL NOT NULL,
    "confidence" REAL NOT NULL,
    "intervalLower" REAL NOT NULL,
    "intervalUpper" REAL NOT NULL,
    "rationale" TEXT NOT NULL,
    "scenarios" TEXT NOT NULL,
    "metrics" TEXT NOT NULL,
    "sources" TEXT NOT NULL,
    "dataQuality" REAL NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'e8.1',
    "stamped" BOOLEAN NOT NULL DEFAULT false,
    "txSig" TEXT,
    "stampId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "canonical" TEXT,
    "p" DECIMAL,
    "deadline" DATETIME,
    "resolverKind" TEXT,
    "resolverRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "memoSig" TEXT,
    "slot" INTEGER,
    "externalMarkets" TEXT,
    "tradingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "marketVolume" REAL,
    "lastMarketSync" DATETIME,
    "featuredDate" DATETIME,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    CONSTRAINT "insights_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "insights_stampId_fkey" FOREIGN KEY ("stampId") REFERENCES "stamps" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_insights" ("canonical", "category", "confidence", "createdAt", "creatorId", "dataQuality", "deadline", "externalMarkets", "featuredDate", "horizon", "id", "intervalLower", "intervalUpper", "lastMarketSync", "marketVolume", "memoSig", "metrics", "modelVersion", "p", "probability", "question", "rationale", "resolverKind", "resolverRef", "scenarios", "slot", "sources", "stampId", "stamped", "status", "tradingEnabled", "txSig", "updatedAt") SELECT "canonical", "category", "confidence", "createdAt", "creatorId", "dataQuality", "deadline", "externalMarkets", "featuredDate", "horizon", "id", "intervalLower", "intervalUpper", "lastMarketSync", "marketVolume", "memoSig", "metrics", "modelVersion", "p", "probability", "question", "rationale", "resolverKind", "resolverRef", "scenarios", "slot", "sources", "stampId", "stamped", "status", "tradingEnabled", "txSig", "updatedAt" FROM "insights";
DROP TABLE "insights";
ALTER TABLE "new_insights" RENAME TO "insights";
CREATE INDEX "insights_createdAt_idx" ON "insights"("createdAt");
CREATE INDEX "insights_category_idx" ON "insights"("category");
CREATE INDEX "insights_stamped_idx" ON "insights"("stamped");
CREATE INDEX "insights_creatorId_idx" ON "insights"("creatorId");
CREATE INDEX "insights_status_idx" ON "insights"("status");
CREATE INDEX "insights_tradingEnabled_idx" ON "insights"("tradingEnabled");
CREATE INDEX "insights_lastMarketSync_idx" ON "insights"("lastMarketSync");
CREATE INDEX "insights_status_deadline_marketVolume_idx" ON "insights"("status", "deadline", "marketVolume");
CREATE INDEX "insights_deadline_idx" ON "insights"("deadline");
CREATE INDEX "insights_featuredDate_idx" ON "insights"("featuredDate");
CREATE INDEX "insights_createdAt_category_status_idx" ON "insights"("createdAt", "category", "status");
CREATE INDEX "insights_visibility_idx" ON "insights"("visibility");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
