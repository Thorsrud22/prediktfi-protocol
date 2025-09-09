-- AlterTable
ALTER TABLE "intents" ADD COLUMN "sourceModelIdHashed" TEXT;

-- CreateIndex
CREATE INDEX "intents_sourceModelIdHashed_idx" ON "intents"("sourceModelIdHashed");
