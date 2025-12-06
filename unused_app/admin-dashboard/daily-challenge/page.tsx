'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Insight {
  id: string;
  question: string;
  category: string;
  probability: number;
  confidence: number;
  deadline: string;
  createdAt: string;
  featuredDate: string | null;
  creator: {
    id: string;
    handle: string;
    score: number;
  } | null;
}

interface FeaturedChallenge {
  id: string;
  question: string;
  category: string;
  featuredDate: string;
  creator: {
    handle: string;
  } | null;
}

export default function DailyChallengeAdmin() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [featuredChallenges, setFeaturedChallenges] = useState<FeaturedChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchData();
    // Set tomorrow as default date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/daily-challenge');
      const data = await response.json();
      setInsights(data.insights || []);
      setFeaturedChallenges(data.featuredChallenges || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetChallenge = async () => {
    if (!selectedInsight || !selectedDate) {
      setMessage({ type: 'error', text: 'Please select both an insight and a date' });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const response = await fetch('/api/admin/daily-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insightId: selectedInsight,
          date: selectedDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: result.error || 'Failed to set challenge' });
        return;
      }

      setMessage({ type: 'success', text: result.message });
      setSelectedInsight('');
      
      // Move to next day
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedDate(nextDay.toISOString().split('T')[0]);
      
      // Refresh data
      await fetchData();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to set challenge' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveChallenge = async (insightId: string) => {
    if (!confirm('Remove this insight from featured challenges?')) return;

    try {
      const response = await fetch('/api/admin/daily-challenge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Challenge removed successfully' });
        await fetchData();
      } else {
        setMessage({ type: 'error', text: 'Failed to remove challenge' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove challenge' });
    }
  };

  // Filter insights
  const filteredInsights = insights.filter(insight => {
    const matchesSearch = insight.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || insight.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(insights.map(i => i.category)))];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      crypto: 'bg-orange-100 text-orange-800',
      stocks: 'bg-green-100 text-green-800',
      tech: 'bg-blue-100 text-blue-800',
      politics: 'bg-red-100 text-red-800',
      sports: 'bg-teal-100 text-teal-800',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Daily Challenge Manager</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Challenge Manager</h1>
        <p className="mt-2 text-gray-600">
          Set featured predictions as Daily Challenges to boost engagement
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center">
            <span className="text-xl mr-2">{message.type === 'success' ? '✅' : '❌'}</span>
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Featured Challenges Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>📅 Scheduled Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          {featuredChallenges.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No challenges scheduled yet</p>
          ) : (
            <div className="space-y-2">
              {featuredChallenges.map(challenge => {
                const date = new Date(challenge.featuredDate);
                const isToday = date.toDateString() === new Date().toDateString();
                const isPast = date < new Date() && !isToday;

                return (
                  <div
                    key={challenge.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isToday
                        ? 'bg-yellow-50 border-yellow-200'
                        : isPast
                        ? 'bg-gray-50 border-gray-200 opacity-50'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-600">
                          {date.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        {isToday && (
                          <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-bold rounded-full">
                            TODAY
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(challenge.category)}`}>
                          {challenge.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{challenge.question}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        By @{challenge.creator?.handle || 'Unknown'}
                      </p>
                    </div>
                    {!isPast && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveChallenge(challenge.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set New Challenge */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Set New Daily Challenge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feature Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Predictions
              </label>
              <input
                type="text"
                placeholder="Search by question..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Insights List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Prediction ({filteredInsights.length} available)
            </label>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredInsights.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No predictions found</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredInsights.map(insight => (
                    <label
                      key={insight.id}
                      className={`flex items-start p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedInsight === insight.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="insight"
                        value={insight.id}
                        checked={selectedInsight === insight.id}
                        onChange={(e) => setSelectedInsight(e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(insight.category)}`}>
                            {insight.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(insight.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">{insight.question}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          By @{insight.creator?.handle || 'Unknown'} • 
                          Confidence: {(insight.confidence * 100).toFixed(0)}% •
                          Probability: {(insight.probability * 100).toFixed(0)}%
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSetChallenge}
            disabled={!selectedInsight || !selectedDate || submitting}
            loading={submitting}
            className="w-full"
          >
            {submitting ? 'Setting Challenge...' : '🚀 Set as Daily Challenge'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
