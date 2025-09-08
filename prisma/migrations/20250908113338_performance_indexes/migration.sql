-- CreateIndex
CREATE INDEX "insights_status_deadline_marketVolume_idx" ON "insights"("status", "deadline", "marketVolume");

-- CreateIndex
CREATE INDEX "insights_deadline_idx" ON "insights"("deadline");
