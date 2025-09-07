-- CreateTable
CREATE TABLE "creators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "handle" TEXT NOT NULL,
    "wallet" TEXT,
    "score" REAL NOT NULL DEFAULT 0.0,
    "accuracy" REAL NOT NULL DEFAULT 0.0,
    "insightsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "brierMean" REAL,
    "binsJson" TEXT,
    "calibration" TEXT,
    "lastScoreUpdate" DATETIME
);

-- CreateTable
CREATE TABLE "insights" (
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
    CONSTRAINT "insights_stampId_fkey" FOREIGN KEY ("stampId") REFERENCES "stamps" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "insights_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stamps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merkleRoot" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'solana',
    "cluster" TEXT NOT NULL DEFAULT 'devnet',
    "txSig" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "outcomes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "insightId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "decidedBy" TEXT NOT NULL,
    "decidedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "outcomes_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "insights" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "meta" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insightId" TEXT,
    CONSTRAINT "events_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "insights" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "creators" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ai_accuracy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelVersion" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "totalPredictions" INTEGER NOT NULL DEFAULT 0,
    "correctPredictions" INTEGER NOT NULL DEFAULT 0,
    "accuracy" REAL NOT NULL DEFAULT 0.0,
    "brierScore" REAL,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ai_calibration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelVersion" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "predictedConfidence" REAL NOT NULL,
    "actualOutcome" BOOLEAN NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "advisor_wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'solana',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "advisor_strategies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "advisor_strategies_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "advisor_wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "advisor_alert_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleJson" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "target" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "advisor_alert_rules_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "advisor_wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "advisor_alert_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "firedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payloadJson" TEXT NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" DATETIME,
    CONSTRAINT "advisor_alert_events_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "advisor_alert_rules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "advisor_holding_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asset" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "valueUsd" TEXT NOT NULL,
    CONSTRAINT "advisor_holding_snapshots_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "advisor_wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "creators_handle_key" ON "creators"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "creators_wallet_key" ON "creators"("wallet");

-- CreateIndex
CREATE INDEX "creators_lastScoreUpdate_idx" ON "creators"("lastScoreUpdate");

-- CreateIndex
CREATE INDEX "insights_createdAt_idx" ON "insights"("createdAt");

-- CreateIndex
CREATE INDEX "insights_category_idx" ON "insights"("category");

-- CreateIndex
CREATE INDEX "insights_stamped_idx" ON "insights"("stamped");

-- CreateIndex
CREATE INDEX "insights_creatorId_idx" ON "insights"("creatorId");

-- CreateIndex
CREATE INDEX "insights_status_idx" ON "insights"("status");

-- CreateIndex
CREATE INDEX "insights_tradingEnabled_idx" ON "insights"("tradingEnabled");

-- CreateIndex
CREATE INDEX "insights_lastMarketSync_idx" ON "insights"("lastMarketSync");

-- CreateIndex
CREATE UNIQUE INDEX "stamps_txSig_key" ON "stamps"("txSig");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "events"("createdAt");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "events_userId_idx" ON "events"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_expiresAt_idx" ON "idempotency_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "ai_accuracy_modelVersion_idx" ON "ai_accuracy"("modelVersion");

-- CreateIndex
CREATE INDEX "ai_accuracy_category_idx" ON "ai_accuracy"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ai_accuracy_modelVersion_category_key" ON "ai_accuracy"("modelVersion", "category");

-- CreateIndex
CREATE INDEX "ai_calibration_modelVersion_idx" ON "ai_calibration"("modelVersion");

-- CreateIndex
CREATE INDEX "ai_calibration_category_idx" ON "ai_calibration"("category");

-- CreateIndex
CREATE INDEX "ai_calibration_timestamp_idx" ON "ai_calibration"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "advisor_wallets_address_key" ON "advisor_wallets"("address");

-- CreateIndex
CREATE INDEX "advisor_wallets_address_idx" ON "advisor_wallets"("address");

-- CreateIndex
CREATE INDEX "advisor_wallets_chain_idx" ON "advisor_wallets"("chain");

-- CreateIndex
CREATE INDEX "advisor_strategies_walletId_idx" ON "advisor_strategies"("walletId");

-- CreateIndex
CREATE INDEX "advisor_strategies_kind_idx" ON "advisor_strategies"("kind");

-- CreateIndex
CREATE INDEX "advisor_alert_rules_walletId_idx" ON "advisor_alert_rules"("walletId");

-- CreateIndex
CREATE INDEX "advisor_alert_rules_channel_idx" ON "advisor_alert_rules"("channel");

-- CreateIndex
CREATE INDEX "advisor_alert_events_ruleId_idx" ON "advisor_alert_events"("ruleId");

-- CreateIndex
CREATE INDEX "advisor_alert_events_firedAt_idx" ON "advisor_alert_events"("firedAt");

-- CreateIndex
CREATE INDEX "advisor_holding_snapshots_walletId_ts_idx" ON "advisor_holding_snapshots"("walletId", "ts");

-- CreateIndex
CREATE INDEX "advisor_holding_snapshots_asset_idx" ON "advisor_holding_snapshots"("asset");
