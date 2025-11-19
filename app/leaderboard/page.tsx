import { Metadata } from 'next';
import { LeaderboardResponse } from '../api/leaderboard/route';
import LeaderboardView from './LeaderboardView';
import LegacyFeaturePlaceholder from '../components/LegacyFeaturePlaceholder';

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
  return (
    <LegacyFeaturePlaceholder
      title="Leaderboard"
      description="The leaderboard is being reimagined to track top idea validators and successful project launches."
    />
  );
}
