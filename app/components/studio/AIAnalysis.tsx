'use client';

import { useOptimizedFetch } from '@/app/hooks/useOptimizedFetch';

interface AIAnalysis {
  confidence: number;
  factors: string[];
  recommendation: 'Bullish' | 'Bearish' | 'Neutral';
  reasoning: string;
  dataPoints: number;
  lastUpdated: string;
}

interface PredictionTemplate {
  id: string;
  title: string;
}

interface AIAnalysisProps {
  selectedTemplate: PredictionTemplate;
}

export default function AIAnalysis({ selectedTemplate }: AIAnalysisProps) {
  const { data: aiAnalysis, loading: analysisLoading } = useOptimizedFetch<AIAnalysis>(
    `/api/studio/analysis/${selectedTemplate.id}`,
    { 
      cacheTime: 10 * 60 * 1000, // 10 minutes cache
      staleTime: 5 * 60 * 1000, // 5 minutes stale time
      timeoutMs: 3000, // 3 second timeout
      retries: 0, // No retries - fail fast
    },
  );

  return (
    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-400/30 p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-white">
        <span className="mr-2">🤖</span>
        AI Analysis for "{selectedTemplate.title}"
      </h3>

      {analysisLoading ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-12 bg-white/10 rounded animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 w-32 bg-white/10 rounded mb-2 animate-pulse"></div>
              <div className="h-3 w-48 bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 bg-white/10 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="flex space-x-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 w-20 bg-white/10 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : aiAnalysis ? (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {aiAnalysis.confidence}%
                </div>
                <div className="text-sm text-blue-300">Confidence</div>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    aiAnalysis.recommendation === 'Bullish'
                      ? 'bg-green-400'
                      : aiAnalysis.recommendation === 'Bearish'
                      ? 'bg-red-400'
                      : 'bg-yellow-400'
                  }`}
                ></div>
                <span
                  className={`font-semibold ${
                    aiAnalysis.recommendation === 'Bullish'
                      ? 'text-green-300'
                      : aiAnalysis.recommendation === 'Bearish'
                      ? 'text-red-300'
                      : 'text-yellow-300'
                  }`}
                >
                  {aiAnalysis.recommendation}
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-blue-300">
              <div>{aiAnalysis.dataPoints.toLocaleString()} data points</div>
              <div>Updated {new Date(aiAnalysis.lastUpdated).toLocaleTimeString()}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-white mb-3">Key Analysis Factors:</h4>
            <div className="flex flex-wrap gap-2">
              {aiAnalysis.factors.map((factor, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white/10 rounded-full text-sm border border-white/20 text-purple-200"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <h4 className="font-medium text-white mb-2 flex items-center">
              <span className="mr-2">💡</span>AI Reasoning:
            </h4>
            <p className="text-blue-200 text-sm leading-relaxed">
              {aiAnalysis.reasoning}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-blue-300">
          <div className="text-2xl mb-2">⚡</div>
          <p>AI analysis will appear here once loaded</p>
        </div>
      )}
    </div>
  );
}