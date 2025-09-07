-- CreateTable
CREATE TABLE "intents" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "intent_receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "intentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "txSig" TEXT,
    "simJson" TEXT,
    "execJson" TEXT,
    "realizedPx" REAL,
    "feesUsd" REAL,
    "slippageBps" INTEGER,
    "blockTime" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "intent_receipts_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "intents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "intents_walletId_createdAt_idx" ON "intents"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "intents_base_quote_idx" ON "intents"("base", "quote");

-- CreateIndex
CREATE INDEX "intent_receipts_intentId_createdAt_idx" ON "intent_receipts"("intentId", "createdAt");

-- CreateIndex
CREATE INDEX "intent_receipts_status_idx" ON "intent_receipts"("status");
