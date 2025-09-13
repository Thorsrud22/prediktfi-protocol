// Enhanced Studio Components for Advanced Analysis
'use client';

import { useState } from 'react';
import { fmt, fmtPct } from '../../lib/num';

interface AnalysisProgress {
  status: string;
  progress: number;
  stage: 'collecting' | 'technical' | 'sentiment' | 'risk' | 'scenarios' | 'complete';
}

interface AdvancedInsightProps {
  progress?: AnalysisProgress;
  analysis?: any; // TODO: Type this properly with AdvancedAnalysis
  isAnalyzing?: boolean;
}

export function AnalysisProgressIndicator({ progress, isAnalyzing }: { progress?: AnalysisProgress; isAnalyzing?: boolean }) {
  if (!isAnalyzing && !progress) return null;

  const stages = [
    { key: 'collecting', label: 'Data Collection', icon: '📊' },
    { key: 'technical', label: 'Technical Analysis', icon: '📈' },
    { key: 'sentiment', label: 'Sentiment Analysis', icon: '💭' },
    { key: 'risk', label: 'Risk Assessment', icon: '⚠️' },
    { key: 'scenarios', label: 'Scenario Generation', icon: '🎯' },
    { key: 'complete', label: 'Analysis Complete', icon: '✅' }
  ];

  const currentStage = progress?.stage || 'collecting';
  const currentProgress = progress?.progress || 0;

  return (
    <div className="bg-[--surface] border border-[--border] rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[--text]">Advanced Analysis in Progress</h3>
        <span className="text-sm text-[--muted]">{currentProgress}%</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div 
          className="bg-gradient-to-r from-[--accent] to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${currentProgress}%` }}
        />
      </div>

      {/* Status message */}
      <p className="text-sm text-[--muted] mb-4">{progress?.status || 'Initializing analysis...'}</p>

      {/* Stage indicators */}
      <div className="grid grid-cols-6 gap-2">
        {stages.map((stage, index) => {
          const isCompleted = stages.findIndex(s => s.key === currentStage) > index;
          const isCurrent = stage.key === currentStage;
          
          return (
            <div key={stage.key} className="text-center">
              <div className={`text-2xl mb-1 ${
                isCompleted ? '' : isCurrent ? 'animate-pulse' : 'opacity-30'
              }`}>
                {stage.icon}
              </div>
              <div className={`text-xs ${
                isCompleted ? 'text-green-600' : isCurrent ? 'text-[--accent]' : 'text-gray-400'
              }`}>
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-[--muted]">
          Deep analysis takes 10-30 seconds for maximum accuracy
        </p>
      </div>
    </div>
  );
}

export function AdvancedInsightDisplay({ analysis }: { analysis: any }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'sentiment' | 'risks' | 'scenarios'>('overview');

  if (!analysis) return null;

  const confidenceColor = analysis.confidence > 0.7 ? 'text-green-400' : 
                          analysis.confidence > 0.4 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-[color:var(--surface)] border border-[var(--border)] rounded-lg p-6">
      {/* Header with key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
          <div className="text-2xl font-bold text-[color:var(--text)]">
            {Math.round(analysis.probability * 100)}%
          </div>
          <div className="text-sm text-[color:var(--muted)]">Probability</div>
        </div>
        
        <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
          <div className={`text-2xl font-bold ${confidenceColor}`}>
            {Math.round(analysis.confidence * 100)}%
          </div>
          <div className="text-sm text-[color:var(--muted)]">Confidence</div>
        </div>
        
        <div className="text-center p-4 bg-[color:var(--surface-2)] rounded-lg border border-[var(--border)]">
          <div className="text-2xl font-bold text-[color:var(--text)]">
            {analysis.processingTimeMs ? fmt(analysis.processingTimeMs / 1000, 1) : '—'}s
          </div>
          <div className="text-sm text-[color:var(--muted)]">Analysis Time</div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex space-x-1 mb-6 bg-[color:var(--surface-2)] rounded-lg p-1">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'technical', label: 'Technical' },
          { key: 'sentiment', label: 'Sentiment' },
          { key: 'risks', label: 'Risks' },
          { key: 'scenarios', label: 'Scenarios' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-[color:var(--surface)] text-[color:var(--text)] shadow-sm border border-[var(--border)]'
                : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div>
            <h4 className="font-semibold text-[color:var(--text)] mb-3">Analysis Summary</h4>
            <p className="text-[color:var(--muted)] mb-4">{analysis.methodology}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-[color:var(--text)] mb-2">Key Drivers</h5>
                <ul className="space-y-1">
                  {analysis.drivers?.map((driver: string, index: number) => (
                    <li key={index} className="text-sm text-[color:var(--muted)] flex items-start">
                      <span className="text-[color:var(--accent)] mr-2">•</span>
                      {driver}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h5 className="font-medium text-[color:var(--text)] mb-2">Data Quality</h5>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-[color:var(--surface-2)] rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full"
                      style={{ width: `${(analysis.dataQuality || 0) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-[color:var(--muted)]">
                    {Math.round((analysis.dataQuality || 0) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'technical' && analysis.technical && (
          <div>
            <h4 className="font-semibold text-[color:var(--text)] mb-3">Technical Analysis</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-[color:var(--surface-2)] rounded border border-[var(--border)]">
                <div className="text-sm text-[color:var(--muted)]">24h Change</div>
                <div className={`text-lg font-semibold ${
                  analysis.technical.change24h > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {analysis.technical.change24h > 0 ? '+' : ''}{fmtPct(analysis.technical.change24h / 100, 2)}
                </div>
              </div>
              
              <div className="p-3 bg-[color:var(--surface-2)] rounded border border-[var(--border)]">
                <div className="text-sm text-[color:var(--muted)]">Trend</div>
                <div className="text-lg font-semibold text-[color:var(--text)] capitalize">
                  {analysis.technical.trend}
                </div>
              </div>
              
              <div className="p-3 bg-[--background] rounded border">
                <div className="text-sm text-[--muted]">RSI</div>
                <div className="text-lg font-semibold text-[--text]">
                  {fmt(analysis.technical.rsi, 1)}
                </div>
              </div>
              
              <div className="p-3 bg-[--background] rounded border">
                <div className="text-sm text-[--muted]">Volatility</div>
                <div className="text-lg font-semibold text-[--text]">
                  {fmtPct(analysis.technical.volatility / 100, 1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sentiment' && analysis.sentiment && (
          <div>
            <h4 className="font-semibold text-[--text] mb-3">Market Sentiment</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[--background] rounded border text-center">
                <div className="text-sm text-[--muted] mb-1">Fear & Greed Index</div>
                <div className="text-3xl font-bold text-[--text]">
                  {analysis.sentiment.fearGreedIndex || 'N/A'}
                </div>
                <div className={`text-sm capitalize ${
                  analysis.sentiment.overallSentiment === 'greed' ? 'text-green-600' :
                  analysis.sentiment.overallSentiment === 'fear' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {analysis.sentiment.overallSentiment}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div>
            <h4 className="font-semibold text-[--text] mb-3">Risk Assessment</h4>
            <div className="space-y-3">
              {analysis.risks?.map((risk: any, index: number) => (
                <div key={index} className="p-3 bg-[--background] rounded border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          risk.impact === 'high' ? 'bg-red-100 text-red-800' :
                          risk.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {risk.impact} impact
                        </span>
                        <span className="text-xs text-[--muted] capitalize">
                          {risk.type}
                        </span>
                      </div>
                      <p className="text-sm text-[--muted]">{risk.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[--text]">
                        {Math.round(risk.likelihood * 100)}%
                      </div>
                      <div className="text-xs text-[--muted]">likelihood</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div>
            <h4 className="font-semibold text-[--text] mb-3">Scenario Analysis</h4>
            <div className="space-y-3">
              {analysis.scenarios?.map((scenario: any, index: number) => (
                <div key={index} className="p-4 bg-[--background] rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-[--text] capitalize">{scenario.name}</h5>
                    <span className="text-lg font-semibold text-[--text]">
                      {Math.round(scenario.probability * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-[--muted] mb-3">{scenario.description}</p>
                  {scenario.targetPrice && (
                    <div className="text-sm text-[--muted]">
                      Target: ${scenario.targetPrice.toLocaleString()}
                    </div>
                  )}
                  <div className="mt-2">
                    <div className="text-xs text-[--muted] mb-1">Key Factors:</div>
                    <div className="flex flex-wrap gap-1">
                      {scenario.keyFactors?.map((factor: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
