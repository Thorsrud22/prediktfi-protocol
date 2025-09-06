-- AddProofFields
-- This migration adds Proof-related fields to existing tables.
-- The fields are already present in the database, so this is a no-op migration
-- to sync Prisma's migration history.

-- All required fields already exist:
-- ALTER TABLE "insights" ADD COLUMN "canonical" TEXT;
-- ALTER TABLE "insights" ADD COLUMN "p" DECIMAL;
-- ALTER TABLE "insights" ADD COLUMN "deadline" DATETIME;
-- ALTER TABLE "insights" ADD COLUMN "resolverKind" TEXT;
-- ALTER TABLE "insights" ADD COLUMN "resolverRef" TEXT;
-- ALTER TABLE "insights" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'OPEN';
-- ALTER TABLE "insights" ADD COLUMN "memoSig" TEXT;
-- ALTER TABLE "insights" ADD COLUMN "slot" INTEGER;

-- ALTER TABLE "creators" ADD COLUMN "brierMean" DECIMAL;
-- ALTER TABLE "creators" ADD COLUMN "binsJson" TEXT;

-- New tables (outcomes, events) already exist

-- All indexes already exist

-- This is a no-op migration to sync Prisma migration history
SELECT 1;
