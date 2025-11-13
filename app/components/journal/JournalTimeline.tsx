import { getReflectionWithCache } from '@/lib/cache/reflection-cache';
import {
  PredictionReflection,
  PredictionReflectionInput,
} from '@/lib/ai/prediction-analyzer';

interface JournalEntry {
  insightId: string;
  question: string;
  predictedOutcome: string;
  predictedProbability?: number;
  actualOutcome: string;
  actualProbability?: number;
  resolvedAt: string;
  predictedAt?: string;
  timeframe?: string;
  category?: string;
  notes?: string;
}

interface JournalTimelineProps {
  entries: JournalEntry[];
  title?: string;
  emptyMessage?: string;
}

function formatDate(value: string | undefined): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function toPercent(probability?: number): string {
  if (probability === undefined || probability === null) {
    return '—';
  }
  const normalized = probability > 1 ? probability / 100 : probability;
  return `${Math.round(normalized * 100)}%`;
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-blue-300/70">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function ReflectionList({
  title,
  items,
  tone = 'neutral',
}: {
  title: string;
  items: string[];
  tone?: 'neutral' | 'positive' | 'action';
}) {
  if (!items.length) return null;

  const toneStyles =
    tone === 'positive'
      ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-100'
      : tone === 'action'
      ? 'bg-indigo-500/10 border-indigo-400/40 text-indigo-100'
      : 'bg-white/5 border-white/10 text-blue-100';

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneStyles}`}>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-white/80">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm leading-relaxed">
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`} className="flex gap-2">
            <span className="mt-1 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function buildReflection(entry: JournalEntry): Promise<PredictionReflection> {
  const reflectionInput: PredictionReflectionInput = {
    insightId: entry.insightId,
    question: entry.question,
    predictedOutcome: entry.predictedOutcome,
    actualOutcome: entry.actualOutcome,
    predictedProbability: entry.predictedProbability,
    actualProbability: entry.actualProbability,
    resolutionDate: entry.resolvedAt,
    timeframe: entry.timeframe,
    category: entry.category,
    notes: entry.notes,
  };

  return getReflectionWithCache(reflectionInput, { tag: entry.insightId });
}

export default async function JournalTimeline({
  entries,
  title = 'Reflection Journal',
  emptyMessage = 'No resolved insights yet. Close predictions to unlock AI feedback.',
}: JournalTimelineProps) {
  if (!entries?.length) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-blue-100">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm opacity-80">{emptyMessage}</p>
      </section>
    );
  }

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime(),
  );

  const reflections = await Promise.all(
    sortedEntries.map(async entry => ({
      entry,
      reflection: await buildReflection(entry),
    })),
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-blue-200/80">
          Track how each prediction resolved and capture coaching notes to improve calibration.
        </p>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-2 top-2 bottom-4 w-px bg-white/10" aria-hidden />
        <div className="space-y-6">
          {reflections.map(({ entry, reflection }) => {
            const confidenceGap = `${reflection.confidenceGap} pts`;
            const accuracy = `${reflection.accuracyScore}%`;
            return (
              <article key={entry.insightId} className="relative">
                <span className="absolute left-[-0.45rem] top-2 flex h-3 w-3 items-center justify-center">
                  <span className="h-3 w-3 rounded-full border border-blue-300 bg-blue-500" />
                </span>
                <div className="rounded-xl border border-white/10 bg-slate-900/70 p-5 shadow-lg">
                  <div className="flex flex-col justify-between gap-3 md:flex-row">
                    <div>
                      <h4 className="text-base font-semibold text-white">{entry.question}</h4>
                      <p className="text-xs uppercase tracking-wide text-blue-300/70">
                        Resolved {formatDate(entry.resolvedAt)} · Predicted {formatDate(entry.predictedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <MetricBadge label="Verdict" value={reflection.verdict.replace('_', ' ')} />
                      <MetricBadge label="Accuracy" value={accuracy} />
                      <MetricBadge label="Confidence Gap" value={confidenceGap} />
                      <MetricBadge
                        label="Predicted"
                        value={toPercent(entry.predictedProbability)}
                      />
                      <MetricBadge
                        label="Actual"
                        value={toPercent(entry.actualProbability ?? (entry.actualOutcome === 'YES' ? 1 : entry.actualOutcome === 'NO' ? 0 : undefined))}
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-blue-100">
                    {reflection.summary}
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <ReflectionList
                      title="What worked"
                      items={reflection.reinforcementPoints}
                      tone="positive"
                    />
                    <ReflectionList
                      title="Improvement opportunities"
                      items={reflection.improvementSuggestions}
                    />
                  </div>

                  <ReflectionList
                    title="Next actions"
                    items={reflection.nextActions}
                    tone="action"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
