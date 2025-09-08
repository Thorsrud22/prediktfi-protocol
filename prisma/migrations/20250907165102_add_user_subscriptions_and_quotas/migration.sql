-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "trialEndsAt" DATETIME,
    "subscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_subscriptions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "advisor_wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_quotas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT NOT NULL,
    "quotaType" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "resetAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_quotas_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pro_trials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerData" TEXT,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pro_trials_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "advisor_wallets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_walletId_key" ON "user_subscriptions"("walletId");

-- CreateIndex
CREATE INDEX "user_subscriptions_tier_idx" ON "user_subscriptions"("tier");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions"("status");

-- CreateIndex
CREATE INDEX "user_quotas_subscriptionId_idx" ON "user_quotas"("subscriptionId");

-- CreateIndex
CREATE INDEX "user_quotas_quotaType_idx" ON "user_quotas"("quotaType");

-- CreateIndex
CREATE INDEX "user_quotas_resetAt_idx" ON "user_quotas"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_quotas_subscriptionId_quotaType_resetAt_key" ON "user_quotas"("subscriptionId", "quotaType", "resetAt");

-- CreateIndex
CREATE INDEX "pro_trials_walletId_idx" ON "pro_trials"("walletId");

-- CreateIndex
CREATE INDEX "pro_trials_isActive_idx" ON "pro_trials"("isActive");

-- CreateIndex
CREATE INDEX "pro_trials_endsAt_idx" ON "pro_trials"("endsAt");
