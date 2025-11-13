'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { JournalInsightsList } from './JournalInsightsList';
import { JournalMetricsOverview } from './JournalMetricsOverview';
import type { JournalApiResponse } from './types';

interface JournalDashboardProps {
  initialCreatorId?: string | null;
  initialHandle?: string | null;
}

export default function JournalDashboard({ initialCreatorId, initialHandle }: JournalDashboardProps) {
  const [creatorId, setCreatorId] = useState(initialCreatorId ?? '');
  const [handle, setHandle] = useState(initialHandle ?? '');
  const [data, setData] = useState<JournalApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canLoad = creatorId.trim().length > 0 || handle.trim().length > 0;

  const fetchData = useCallback(async (options?: { creatorId?: string; handle?: string }) => {
    const params = new URLSearchParams();
    const id = options?.creatorId ?? creatorId;
    const h = options?.handle ?? handle;

    if (id) {
      params.set('creatorId', id);
    } else if (h) {
      params.set('handle', h);
    }

    if (params.toString().length === 0) {
      setError('Provide a creator handle or ID to load your journal.');
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/me/journal?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload.error || 'Unable to load journal data.');
        setData(null);
        return;
      }

      const payload = (await response.json()) as JournalApiResponse;
      setData(payload);
    } catch (err) {
      console.error('Failed to fetch journal data', err);
      setError('Network error while loading journal data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [creatorId, handle]);

  useEffect(() => {
    if (canLoad) {
      void fetchData();
    }
  }, [canLoad, fetchData]);

  const pendingReminderText = useMemo(() => {
    if (!data) return '';
    const { pendingReminders } = data;
    if (pendingReminders === 0) {
      return 'All reminders are up to date.';
    }
    if (pendingReminders === 1) {
      return 'You have 1 reminder waiting for follow-up.';
    }
    return `You have ${pendingReminders} reminders waiting for follow-up.`;
  }, [data]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personal Journal</h1>
          <p className="text-sm text-gray-600">Review your insights, reflections, and reminders in one place.</p>
        </div>

        <form
          className="flex flex-col sm:flex-row gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void fetchData();
          }}
        >
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1" htmlFor="creator-id">
              Creator ID
            </label>
            <input
              id="creator-id"
              type="text"
              value={creatorId}
              onChange={(event) => setCreatorId(event.target.value)}
              placeholder="cuid…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1" htmlFor="creator-handle">
              Creator handle
            </label>
            <input
              id="creator-handle"
              type="text"
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="wallet or handle"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="self-end inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            disabled={!canLoad || loading}
          >
            {loading ? 'Loading…' : 'Load journal'}
          </button>
        </form>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {data && !error && (
          <div className="rounded-md border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
            Tracking journal for <strong>{data.creator.handle ?? data.creator.id}</strong>. {pendingReminderText}
          </div>
        )}
      </header>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Insight queue</h2>
        <JournalInsightsList insights={data?.insights ?? []} loading={loading && !data} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Personal metrics</h2>
        <JournalMetricsOverview metrics={data?.metrics} loading={loading && !data} />
      </section>
    </div>
  );
}
