-- AlterTable
ALTER TABLE "insights" ADD COLUMN "featuredDate" DATETIME;

-- CreateIndex
CREATE INDEX "insights_featuredDate_idx" ON "insights"("featuredDate");
