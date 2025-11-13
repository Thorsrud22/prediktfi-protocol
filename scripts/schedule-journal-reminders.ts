import { prisma } from '../app/lib/prisma';
import { JournalReminderStatus } from '@prisma/client';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const REMINDER_WINDOWS_DAYS = [7, 1];

export interface ReminderSummary {
  created: number;
  sent: number;
  skipped: number;
}

export async function scheduleJournalReminders(): Promise<ReminderSummary> {
  const now = new Date();
  let created = 0;
  let sent = 0;
  let skipped = 0;

  const insights = await prisma.insight.findMany({
    where: {
      creatorId: { not: null },
      deadline: { not: null },
    },
    include: {
      creator: {
        select: { id: true, handle: true, wallet: true },
      },
      journalReminders: true,
    },
  });

  for (const insight of insights) {
    if (!insight.creatorId || !insight.deadline) continue;

    for (const windowDays of REMINDER_WINDOWS_DAYS) {
      const remindAt = new Date(insight.deadline.getTime() - windowDays * DAY_IN_MS);
      if (remindAt <= now) {
        skipped++;
        continue;
      }

      const hasReminder = insight.journalReminders.some((reminder) => {
        return Math.abs(reminder.remindAt.getTime() - remindAt.getTime()) < 60 * 60 * 1000;
      });

      if (!hasReminder) {
        await prisma.journalReminder.create({
          data: {
            creatorId: insight.creatorId,
            insightId: insight.id,
            remindAt,
          },
        });
        created++;
        console.log(
          `📅 Scheduled reminder ${windowDays}d before deadline for ${insight.creator?.handle ?? insight.creatorId}`,
        );
      }
    }
  }

  const dueReminders = await prisma.journalReminder.findMany({
    where: {
      status: JournalReminderStatus.PENDING,
      remindAt: { lte: now },
    },
    include: {
      creator: {
        select: { id: true, handle: true, wallet: true },
      },
      insight: {
        select: { id: true, canonical: true, question: true, deadline: true },
      },
    },
  });

  for (const reminder of dueReminders) {
    console.log(
      `🔔 Sending journal reminder to ${reminder.creator?.handle ?? reminder.creatorId}: ${
        reminder.insight?.canonical ?? reminder.insight?.question ?? reminder.insightId
      } (due ${reminder.insight?.deadline?.toISOString() ?? 'unknown'})`,
    );

    await prisma.journalReminder.update({
      where: { id: reminder.id },
      data: {
        status: JournalReminderStatus.SENT,
        sentAt: new Date(),
      },
    });
    sent++;
  }

  return { created, sent, skipped };
}

async function main() {
  try {
    const summary = await scheduleJournalReminders();
    console.log(`✅ Reminder scheduling complete. Created: ${summary.created}, Sent: ${summary.sent}, Skipped: ${summary.skipped}`);
  } catch (error) {
    console.error('Failed to schedule journal reminders', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
