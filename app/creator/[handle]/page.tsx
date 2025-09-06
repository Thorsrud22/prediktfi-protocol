import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileResponse } from '../../api/profile/[handle]/route';
import CalibrationChart from '../../components/CalibrationChart';
import InsightCard from '../../components/InsightCard';

interface PageProps {
  params: Promise<{ handle: string }>;
}

async function getProfile(handle: string): Promise<ProfileResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/profile/${handle}`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle);
  
  if (!profile) {
    return {
      title: 'Creator Not Found | PrediktFi',
      description: 'The requested creator profile could not be found.',
    };
  }
  
  return {
    title: `${profile.creator.handle} | PrediktFi Creator`,
    description: `View ${profile.creator.handle}'s prediction track record, Brier score, and calibration metrics on PrediktFi.`,
    openGraph: {
      title: `${profile.creator.handle} - PrediktFi Creator`,
      description: `Score: ${profile.creator.score.toFixed(3)} | Accuracy: ${(profile.creator.accuracy * 100).toFixed(1)}% | ${profile.stats.resolvedInsights} resolved predictions`,
      type: 'profile',
    },
  };
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const profile = await getProfile(handle);
  
  if (!profile) {
    notFound();
  }
  
  const { creator, stats, recentInsights, rank } = profile;
  
  // Calculate performance indicators
  const performanceLevel = creator.score >= 0.8 ? 'excellent' : 
                          creator.score >= 0.6 ? 'good' : 
                          creator.score >= 0.4 ? 'fair' : 'needs-improvement';
  
  const performanceColor = {
    'excellent': 'text-green-600 bg-green-50',
    'good': 'text-blue-600 bg-blue-50', 
    'fair': 'text-yellow-600 bg-yellow-50',
    'needs-improvement': 'text-red-600 bg-red-50'
  }[performanceLevel];
  
  const performanceText = {
    'excellent': 'Excellent',
    'good': 'Good',
    'fair': 'Fair', 
    'needs-improvement': 'Needs Improvement'
  }[performanceLevel];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {creator.handle.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {creator.handle}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Joined {new Date(creator.joinedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Last active {new Date(creator.lastActive).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Rank #{rank.overall}</span>
                </div>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${performanceColor}`}>
              {performanceText} Predictor
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {creator.score.toFixed(3)}
            </div>
            <div className="text-sm text-gray-600">Brier Score</div>
            <div className="text-xs text-gray-500 mt-1">
              Lower is better (0.000 = perfect)
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(creator.accuracy * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
            <div className="text-xs text-gray-500 mt-1">
              Correct predictions
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.resolvedInsights}
            </div>
            <div className="text-sm text-gray-600">Resolved</div>
            <div className="text-xs text-gray-500 mt-1">
              Out of {stats.totalInsights} total
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.period90d.resolvedInsights}
            </div>
            <div className="text-sm text-gray-600">Last 90 Days</div>
            <div className="text-xs text-gray-500 mt-1">
              Recent activity
            </div>
          </div>
        </div>
        
        {/* Calibration Chart */}
        {stats.calibrationBins.some(bin => bin.count > 0) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Calibration Analysis</h2>
            <CalibrationChart bins={stats.calibrationBins} />
            <div className="mt-4 text-sm text-gray-600">
              <p>
                This chart shows how well-calibrated your predictions are. Points closer to the diagonal line indicate better calibration.
                When you predict 70% confidence, about 70% of those predictions should come true.
              </p>
            </div>
          </div>
        )}
        
        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Time Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Predictions</span>
                <span className="font-medium">{stats.totalInsights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resolved</span>
                <span className="font-medium">{stats.resolvedInsights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium">{stats.pendingInsights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Brier Score</span>
                <span className="font-medium">{stats.averageBrier.toFixed(3)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance (90d)</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Predictions</span>
                <span className="font-medium">{stats.period90d.totalInsights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resolved</span>
                <span className="font-medium">{stats.period90d.resolvedInsights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Average Brier Score</span>
                <span className="font-medium">{stats.period90d.averageBrier.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">90d Rank</span>
                <span className="font-medium">#{rank.period90d}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Predictions</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentInsights.length > 0 ? (
              recentInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} showCreator={false} />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No predictions yet. Start making predictions to build your track record!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}