'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { SkeletonActivityItem } from './ui/Skeleton';

interface Activity {
  id: string;
  type: 'prediction_created' | 'market_connected' | 'outcome_resolved' | 'score_updated';
  user: string;
  userScore?: number;
  action: string;
  target?: string;
  timestamp: string;
  icon: string;
}

const ActivityFeed = memo(function ActivityFeed({ className = '' }: { className?: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate real-time activity feed
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'prediction_created',
        user: 'alice_predictor',
        userScore: 4.8,
        action: 'created a new prediction',
        target: 'Will AI surpass human intelligence by 2030?',
        timestamp: '2 minutes ago',
        icon: '🔮'
      },
      {
        id: '2',
        type: 'market_connected',
        user: 'bob_analyst',
        userScore: 4.2,
        action: 'connected to Polymarket',
        target: 'Bitcoin reaching $100k',
        timestamp: '5 minutes ago',
        icon: '🔗'
      },
      {
        id: '3',
        type: 'outcome_resolved',
        user: 'system',
        action: 'resolved prediction',
        target: 'Tesla stock hitting new highs',
        timestamp: '10 minutes ago',
        icon: '✅'
      },
      {
        id: '4',
        type: 'score_updated',
        user: 'charlie_expert',
        userScore: 4.9,
        action: 'achieved new high score',
        target: '95% accuracy rate',
        timestamp: '15 minutes ago',
        icon: '⭐'
      },
      {
        id: '5',
        type: 'prediction_created',
        user: 'diana_trader',
        userScore: 3.8,
        action: 'created a prediction',
        target: 'Ethereum merge success rate',
        timestamp: '20 minutes ago',
        icon: '🔮'
      }
    ];

    setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 500);

    // Simulate new activities every 30 seconds (reduced frequency)
    const interval = setInterval(() => {
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: 'prediction_created',
        user: `user_${Math.floor(Math.random() * 1000)}`,
        userScore: Math.random() * 5,
        action: 'created a new prediction',
        target: 'New market prediction',
        timestamp: 'just now',
        icon: '🔮'
      };
      
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 ${className}`}>
        <h3 className="text-xl font-bold text-white mb-4">🔥 Live Activity</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <SkeletonActivityItem key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 ${className}`}>
      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
        <span className="relative flex h-3 w-3 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        Live Activity
      </h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div 
            key={activity.id}
            className="flex items-start space-x-3"
          >
            <span className="text-2xl">{activity.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">
                <Link 
                  href={`/creator/${activity.user}`}
                  className="font-semibold hover:text-blue-400 transition-colors"
                >
                  @{activity.user}
                </Link>
                {activity.userScore && (
                  <span className="ml-1 text-xs text-yellow-400">
                    ({activity.userScore.toFixed(1)}⭐)
                  </span>
                )}
                <span className="text-gray-400 ml-1">{activity.action}</span>
              </p>
              {activity.target && (
                <p className="text-xs text-gray-500 truncate mt-1">
                  "{activity.target}"
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
});

export default ActivityFeed;
