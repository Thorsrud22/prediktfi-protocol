-- CreateIndex
CREATE INDEX "intent_receipts_createdAt_idx" ON "intent_receipts"("createdAt");

-- CreateIndex
CREATE INDEX "intent_receipts_blockTime_idx" ON "intent_receipts"("blockTime");

-- CreateIndex
CREATE INDEX "intents_strategyId_idx" ON "intents"("strategyId");

-- CreateIndex
CREATE INDEX "intents_side_idx" ON "intents"("side");

-- CreateIndex
CREATE INDEX "intents_createdAt_idx" ON "intents"("createdAt");
