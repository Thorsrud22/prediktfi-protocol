-- CreateTable
CREATE TABLE "pmf_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricType" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "target" REAL NOT NULL,
    "period" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_events_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "advisor_wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_retention" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "firstAction" DATETIME NOT NULL,
    "lastAction" DATETIME NOT NULL,
    "d1Active" BOOLEAN NOT NULL DEFAULT false,
    "d3Active" BOOLEAN NOT NULL DEFAULT false,
    "d7Active" BOOLEAN NOT NULL DEFAULT false,
    "d14Active" BOOLEAN NOT NULL DEFAULT false,
    "d30Active" BOOLEAN NOT NULL DEFAULT false,
    "totalActions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_retention_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "advisor_wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "social_shares" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intentId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "shareUrl" TEXT,
    "receiptId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "social_shares_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "intents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "social_shares_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "advisor_wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_intents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "strategyId" TEXT,
    "chain" TEXT NOT NULL DEFAULT 'solana',
    "base" TEXT NOT NULL,
    "quote" TEXT NOT NULL DEFAULT 'USDC',
    "side" TEXT NOT NULL,
    "sizeJson" TEXT NOT NULL,
    "tpJson" TEXT,
    "slJson" TEXT,
    "rationale" TEXT,
    "confidence" REAL,
    "backtestWin" REAL,
    "expectedDur" TEXT,
    "guardsJson" TEXT NOT NULL,
    "venuePref" TEXT DEFAULT 'jupiter',
    "simOnly" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "intents_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "advisor_wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_intents" ("backtestWin", "base", "chain", "confidence", "createdAt", "expectedDur", "guardsJson", "id", "quote", "rationale", "side", "simOnly", "sizeJson", "slJson", "strategyId", "tpJson", "venuePref", "walletId") SELECT "backtestWin", "base", "chain", "confidence", "createdAt", "expectedDur", "guardsJson", "id", "quote", "rationale", "side", "simOnly", "sizeJson", "slJson", "strategyId", "tpJson", "venuePref", "walletId" FROM "intents";
DROP TABLE "intents";
ALTER TABLE "new_intents" RENAME TO "intents";
CREATE INDEX "intents_walletId_createdAt_idx" ON "intents"("walletId", "createdAt");
CREATE INDEX "intents_base_quote_idx" ON "intents"("base", "quote");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "pmf_metrics_metricType_date_idx" ON "pmf_metrics"("metricType", "date");

-- CreateIndex
CREATE INDEX "pmf_metrics_period_idx" ON "pmf_metrics"("period");

-- CreateIndex
CREATE INDEX "user_events_walletId_eventType_idx" ON "user_events"("walletId", "eventType");

-- CreateIndex
CREATE INDEX "user_events_timestamp_idx" ON "user_events"("timestamp");

-- CreateIndex
CREATE INDEX "user_events_sessionId_idx" ON "user_events"("sessionId");

-- CreateIndex
CREATE INDEX "user_retention_firstAction_idx" ON "user_retention"("firstAction");

-- CreateIndex
CREATE UNIQUE INDEX "user_retention_walletId_key" ON "user_retention"("walletId");

-- CreateIndex
CREATE INDEX "social_shares_platform_createdAt_idx" ON "social_shares"("platform", "createdAt");

-- CreateIndex
CREATE INDEX "social_shares_intentId_idx" ON "social_shares"("intentId");
