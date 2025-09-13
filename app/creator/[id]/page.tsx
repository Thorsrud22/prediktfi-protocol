import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import CreatorProfileClient from './CreatorProfileClient';
import { CreatorScore } from '@/src/lib/creatorClient';

export const dynamic = 'force-dynamic';

async function getCreatorScore(id: string): Promise<CreatorScore | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/public/creators/${id}/score`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const creator = await getCreatorScore(id);
    
    if (!creator) {
      return {
        title: 'Creator Profile',
        description: 'View creator performance and prediction history',
      };
    }
    
    const handle = creator.handle ?? id;
    const acc = creator.accuracy90d != null ? (creator.accuracy90d * 100).toFixed(1) : '—';
    
    return {
      title: `${handle} • Creator Profile | PrediktFi`,
      description: `See ${handle}'s predictions, score ${creator.score.toFixed(3)} and ${acc}% accuracy (90d) on PrediktFi.`,
      alternates: { canonical: `/creator/${handle}` },
      openGraph: {
        title: `${handle} • Creator Profile`,
        description: `90d accuracy: ${acc}%`,
        images: [`/api/og/creator/${handle}`],
        type: 'profile',
      },
      twitter: { 
        card: 'summary_large_image',
        images: [`/api/og/creator/${handle}`]
      },
      robots: process.env.NODE_ENV === 'development' ? { index: false } : undefined,
    };
  } catch {
    return {
      title: 'Creator Profile',
      description: 'View creator performance and prediction history',
    };
  }
}

export default async function CreatorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const creator = await getCreatorScore(id);
  
  if (!creator) {
    notFound();
  }
  
  // Redirect to canonical URL if accessing via hashed ID instead of handle
  if (creator.handle && id !== creator.handle) {
    redirect(`/creator/${creator.handle}`);
  }
  
  return <CreatorProfileClient id={id} />;
}