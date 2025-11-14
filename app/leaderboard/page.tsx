import { Metadata } from 'next';
import { LeaderboardResponse } from '../api/leaderboard/route';
import LeaderboardView from './LeaderboardView';

export const metadata: Metadata = {
  title: 'Leaderboard | PrediktFi',
  description: 'Top prediction makers ranked by Brier score and accuracy on PrediktFi.',
  openGraph: {
    title: 'PrediktFi Leaderboard',
    description: 'Discover the most accurate prediction makers and their track records.',
    type: 'website',
  },
};

interface LeaderboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

async function fetchLeaderboard(period: 'all' | '90d' = 'all'): Promise<LeaderboardResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/leaderboard?period=${period}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return null;
  }
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { period = 'all' } = await searchParams;
  const selectedPeriod: 'all' | '90d' = period === '90d' ? '90d' : 'all';

  const leaderboardData = await fetchLeaderboard(selectedPeriod);

  if (!leaderboardData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center backdrop-blur-xl bg-slate-800/50 rounded-2xl border border-red-500/20 p-12 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-4">Leaderboard Unavailable</h1>
          <p className="text-slate-400">Unable to load leaderboard data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return <LeaderboardView data={leaderboardData} selectedPeriod={selectedPeriod} />;
}
