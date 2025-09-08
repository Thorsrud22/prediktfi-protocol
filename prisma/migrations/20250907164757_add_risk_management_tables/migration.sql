-- CreateTable
CREATE TABLE "asset_loss_caps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "maxLossPct" REAL NOT NULL,
    "currentLossPct" REAL NOT NULL DEFAULT 0.0,
    "dailyLossUsd" REAL NOT NULL DEFAULT 0.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "asset_loss_caps_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "advisor_wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_loss_caps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "maxDailyLossPct" REAL NOT NULL,
    "currentLossPct" REAL NOT NULL DEFAULT 0.0,
    "dailyLossUsd" REAL NOT NULL DEFAULT 0.0,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "daily_loss_caps_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "advisor_wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "asset_loss_caps_walletId_idx" ON "asset_loss_caps"("walletId");

-- CreateIndex
CREATE INDEX "asset_loss_caps_asset_idx" ON "asset_loss_caps"("asset");

-- CreateIndex
CREATE UNIQUE INDEX "asset_loss_caps_walletId_asset_key" ON "asset_loss_caps"("walletId", "asset");

-- CreateIndex
CREATE INDEX "daily_loss_caps_walletId_idx" ON "daily_loss_caps"("walletId");

-- CreateIndex
CREATE INDEX "daily_loss_caps_date_idx" ON "daily_loss_caps"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_loss_caps_walletId_date_key" ON "daily_loss_caps"("walletId", "date");
