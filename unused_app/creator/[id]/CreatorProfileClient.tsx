'use client';

import { useState, useEffect, useRef } from 'react';
import { notFound } from 'next/navigation';
import ProfileHeader from '../../components/creator/ProfileHeader';
import KpiGrid from '../../components/creator/KpiGrid';
import ScoreSparkline from '../../components/creator/ScoreSparkline';
import RecentInsights from '../../components/creator/RecentInsights';
import { getCreatorProfileData, getCreatorHistory, CreatorScore, CreatorHistory, CreatorInsightLite } from '@/src/lib/creatorClient';

interface CreatorProfileData {
  score: CreatorScore;
  history: CreatorHistory;
  insights: CreatorInsightLite[];
}

interface CreatorProfileClientProps {
  id: string;
}

export default function CreatorProfileClient({ id }: CreatorProfileClientProps) {
  const [profileData, setProfileData] = useState<CreatorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyPeriod, setHistoryPeriod] = useState<'30d' | '90d'>('90d');
  const [insightsFilter, setInsightsFilter] = useState<'last90d' | null>(null);
  const recentInsightsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getCreatorProfileData(id);
        setProfileData(data);
      } catch (err) {
        console.error('Failed to load creator profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        if (err instanceof Error && err.message === 'Creator not found') {
          notFound();
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [id]);

  // Analytics handlers
  const handleShare = (channel: 'x' | 'copy') => {
    if (profileData && typeof window !== 'undefined') {
      // Track share event
      console.log('creator_profile_share_clicked', {
        creatorId: profileData.score.idHashed,
        handle: profileData.score.handle,
        channel,
        referrer_path: document.referrer || '',
        creator_rank_at_click: profileData.score.rank7d || null,
        ts: Date.now(),
      });
    }
  };

  const handleInsightClick = (insightId: string) => {
    if (profileData && typeof window !== 'undefined') {
      // Track insight view
      console.log('creator_profile_insight_view_clicked', {
        insightId,
        creatorId: profileData.score.idHashed,
        creator_handle: profileData.score.handle,
        referrer_path: document.referrer || '',
        ts: Date.now(),
      });
    }
  };

  const handleKpiClick = (kpiType: string) => {
    if (kpiType === 'last90d') {
      // Set the filter
      setInsightsFilter('last90d');
      
      // Scroll to RecentInsights section
      if (recentInsightsRef.current) {
        recentInsightsRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  };

  const handlePeriodChange = async (period: '30d' | '90d') => {
    if (!profileData) return;
    
    setHistoryPeriod(period);
    try {
      const newHistory = await getCreatorHistory(id, period);
      setProfileData({
        ...profileData,
        history: newHistory
      });
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  // Track profile view
  useEffect(() => {
    if (profileData && typeof window !== 'undefined') {
      console.log('creator_profile_view', {
        creatorId: profileData.score.idHashed,
        handle: profileData.score.handle,
        period: historyPeriod,
        referrer_path: document.referrer || '',
        creator_rank_at_view: profileData.score.rank7d || null,
        ts: Date.now(),
      });
    }
  }, [profileData, historyPeriod]);

  if (loading) {
    return <div>Loading...</div>; // This will show the loading.tsx skeleton
  }

  if (error || !profileData) {
    return notFound();
  }

  // Generate structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": profileData.score.handle,
    "identifier": profileData.score.idHashed,
    "url": `${typeof window !== 'undefined' ? window.location.origin : 'https://predikt.fi'}/creator/${profileData.score.handle}`,
    "description": `PrediktFi creator with ${(profileData.score.accuracy90d * 100).toFixed(1)}% accuracy and score ${profileData.score.score.toFixed(3)}`,
    "memberOf": {
      "@type": "Organization",
      "name": "PrediktFi",
      "url": "https://predikt.fi"
    },
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Prediction Score",
        "value": profileData.score.score.toFixed(3)
      },
      {
        "@type": "PropertyValue", 
        "name": "90-Day Accuracy",
        "value": `${(profileData.score.accuracy90d * 100).toFixed(1)}%`
      },
      {
        "@type": "PropertyValue",
        "name": "Resolved Predictions", 
        "value": profileData.score.counts.resolved
      },
      {
        "@type": "PropertyValue",
        "name": "Pending Predictions",
        "value": profileData.score.counts.pending
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <ProfileHeader 
            creator={profileData.score} 
            onShare={handleShare}
          />
        </div>

        {/* KPI Grid */}
        <div className="mb-8">
          <KpiGrid creator={profileData.score} onKpiClick={handleKpiClick} />
        </div>

        {/* Score History */}
        <div className="mb-8">
          <ScoreSparkline 
            history={profileData.history} 
            onPeriodChange={handlePeriodChange}
          />
        </div>

        {/* Recent Insights */}
        <RecentInsights 
          ref={recentInsightsRef}
          insights={profileData.insights} 
          onInsightClick={handleInsightClick}
          filter={insightsFilter}
          onFilterChange={setInsightsFilter}
        />
      </div>
    </div>
  );
}
