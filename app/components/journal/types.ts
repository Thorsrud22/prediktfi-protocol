export type JournalReminderStatus = 'PENDING' | 'SENT' | 'CANCELLED';

export interface JournalReminderSummary {
  id: string;
  remindAt: string;
  status: JournalReminderStatus;
  sentAt?: string | null;
}

export interface JournalEntrySummary {
  id: string;
  title?: string | null;
  content?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalOutcomeSummary {
  result: string;
  decidedAt?: string | null;
}

export interface JournalInsightSummary {
  id: string;
  canonical: string;
  question: string;
  probability: number;
  deadline?: string | null;
  status: string;
  createdAt: string;
  dueInDays?: number | null;
  entry?: JournalEntrySummary | null;
  outcome?: JournalOutcomeSummary | null;
  reminders: JournalReminderSummary[];
  nextReminder?: string | null;
}

export interface JournalMetricPeriod {
  label: '7d' | '30d' | '90d';
  from: string;
  to: string;
  metrics: {
    score: number;
    count: number;
    reliability: number;
    resolution: number;
    uncertainty: number;
  };
  calibration: Array<{
    bin: number;
    predicted: number;
    actual: number;
    count: number;
    deviation: number;
  }>;
}

export interface JournalMetricsSummary {
  periods: Record<'7d' | '30d' | '90d', JournalMetricPeriod>;
}

export interface JournalApiResponse {
  creator: {
    id: string;
    handle: string | null;
    wallet: string | null;
  };
  insights: JournalInsightSummary[];
  metrics: JournalMetricsSummary;
  pendingReminders: number;
}
