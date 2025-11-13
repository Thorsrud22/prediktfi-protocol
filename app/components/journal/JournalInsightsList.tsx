'use client';

import type { JournalInsightSummary } from './types';

interface JournalInsightsListProps {
  insights: JournalInsightSummary[];
  loading?: boolean;
}

export function JournalInsightsList({ insights, loading = false }: JournalInsightsListProps) {
  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        Loading journal insights…
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
        No insights found for this creator yet. Create predictions to start your personal journal.
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Insight
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Probability
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Deadline
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Journal Entry
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Next Reminder
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {insights.map((insight) => {
            const probability = Math.round(insight.probability * 100);
            const deadline = insight.deadline
              ? new Date(insight.deadline).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '–';

            const nextReminder = insight.nextReminder
              ? new Date(insight.nextReminder).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—';

            const entryStatus = insight.entry
              ? `Updated ${new Date(insight.entry.updatedAt).toLocaleDateString()}`
              : 'Draft pending';

            return (
              <tr key={insight.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="font-medium text-gray-900">{insight.canonical}</div>
                  <div className="text-xs text-gray-500 truncate max-w-md">{insight.question}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{probability}%</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {deadline}
                  {typeof insight.dueInDays === 'number' && (
                    <div className="text-xs text-gray-500">{insight.dueInDays >= 0 ? `${insight.dueInDays} days remaining` : `${Math.abs(insight.dueInDays)} days overdue`}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{entryStatus}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{nextReminder}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{insight.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
