-- CreateTable
CREATE TABLE "simulator_accuracy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pair" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "expectedPrice" REAL NOT NULL,
    "theoreticalFillPrice" REAL NOT NULL,
    "deviationBps" REAL NOT NULL,
    "tradeSizeUsd" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jupiterQuoteData" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "simulator_accuracy_pair_timestamp_idx" ON "simulator_accuracy"("pair", "timestamp");

-- CreateIndex
CREATE INDEX "simulator_accuracy_side_idx" ON "simulator_accuracy"("side");

-- CreateIndex
CREATE INDEX "simulator_accuracy_deviationBps_idx" ON "simulator_accuracy"("deviationBps");
