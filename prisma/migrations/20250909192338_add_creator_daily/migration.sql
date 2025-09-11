-- AlterTable
ALTER TABLE "events" ADD COLUMN "experimentKey" TEXT;
ALTER TABLE "events" ADD COLUMN "variant" TEXT;

-- CreateTable
CREATE TABLE "creator_daily" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "day" DATETIME NOT NULL,
    "maturedN" INTEGER NOT NULL,
    "brierMean" REAL NOT NULL,
    "retStd30d" REAL,
    "notional30d" REAL NOT NULL,
    "accuracy" REAL NOT NULL,
    "consistency" REAL NOT NULL,
    "volumeScore" REAL NOT NULL,
    "recencyScore" REAL NOT NULL,
    "score" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "creator_daily_creatorId_day_idx" ON "creator_daily"("creatorId", "day");

-- CreateIndex
CREATE INDEX "creator_daily_day_score_idx" ON "creator_daily"("day", "score");

-- CreateIndex
CREATE UNIQUE INDEX "creator_daily_creatorId_day_key" ON "creator_daily"("creatorId", "day");

-- CreateIndex
CREATE INDEX "creators_score_accuracy_insightsCount_idx" ON "creators"("score", "accuracy", "insightsCount");

-- CreateIndex
CREATE INDEX "events_experimentKey_variant_idx" ON "events"("experimentKey", "variant");

-- CreateIndex
CREATE INDEX "insights_createdAt_category_status_idx" ON "insights"("createdAt", "category", "status");
