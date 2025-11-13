-- CreateTable
CREATE TABLE "personal_journal_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "personal_journal_entries_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "personal_journal_entries_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "insights" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journal_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "entryId" TEXT,
    "remindAt" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "journal_reminders_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "journal_reminders_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "insights" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "journal_reminders_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "personal_journal_entries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "personal_journal_entries_creatorId_idx" ON "personal_journal_entries"("creatorId");

-- CreateIndex
CREATE INDEX "personal_journal_entries_insightId_idx" ON "personal_journal_entries"("insightId");

-- CreateIndex
CREATE INDEX "journal_reminders_creatorId_idx" ON "journal_reminders"("creatorId");

-- CreateIndex
CREATE INDEX "journal_reminders_insightId_idx" ON "journal_reminders"("insightId");

-- CreateIndex
CREATE INDEX "journal_reminders_remindAt_idx" ON "journal_reminders"("remindAt");
