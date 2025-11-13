import JournalDashboard from '@/app/components/journal/JournalDashboard';

interface JournalPageProps {
  searchParams?: {
    creatorId?: string;
    handle?: string;
  };
}

export const metadata = {
  title: 'Personal Journal • Predikt',
  description: 'Track your insights, reflections, and reminders across multiple time horizons.',
};

export default function JournalPage({ searchParams }: JournalPageProps) {
  const creatorId = searchParams?.creatorId ?? null;
  const handle = searchParams?.handle ?? null;

  return <JournalDashboard initialCreatorId={creatorId} initialHandle={handle} />;
}
