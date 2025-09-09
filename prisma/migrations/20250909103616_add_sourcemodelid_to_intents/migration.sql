-- AlterTable
ALTER TABLE "intents" ADD COLUMN "sourceModelId" TEXT;

-- CreateIndex
CREATE INDEX "intents_sourceModelId_idx" ON "intents"("sourceModelId");
