/**
 * Score Documentation Page
 * Explains the creator scoring system components and formulas
 */

import { Metadata } from 'next';
import { SCORE } from '../../lib/creatorScore';

export const metadata: Metadata = {
  title: 'Scoring System | Predikt',
  description: 'Learn how creator scores are calculated with accuracy, consistency, volume, and recency components.',
};

interface ScoreComponentProps {
  title: string;
  weight: number;
  formula: string;
  description: string;
  example: string;
  color: string;
}

function ScoreComponent({ title, weight, formula, description, example, color }: ScoreComponentProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
          {Math.round(weight * 100)}% weight
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Formula:</h4>
          <code className="block bg-gray-100 p-3 rounded text-sm font-mono text-gray-800">
            {formula}
          </code>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Example:</h4>
          <p className="text-sm text-gray-600">{example}</p>
        </div>
      </div>
    </div>
  );
}

export default function ScoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Creator Scoring System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn how creator scores are calculated using four key components: 
            accuracy, consistency, volume, and recency.
          </p>
        </div>

        {/* Overall Formula */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Overall Score Formula</h2>
          <div className="bg-white p-4 rounded border">
            <code className="text-lg font-mono text-gray-800">
              Score = W_ACC × Accuracy + W_CONS × Consistency + W_VOL × Volume + W_REC × Recency
            </code>
          </div>
          <p className="text-sm text-blue-700 mt-3">
            Where each component is weighted and normalized to a 0-1 scale.
          </p>
        </div>

        {/* Score Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ScoreComponent
            title="Accuracy"
            weight={SCORE.W_ACC}
            formula="Accuracy = 1 - Brier_Mean"
            description="Measures how well-calibrated predictions are. Lower Brier scores indicate better calibration, so we invert it (1 - Brier) to get a positive score."
            example="If Brier score is 0.2, accuracy = 1 - 0.2 = 0.8 (80%)"
            color="bg-green-100 text-green-800"
          />
          
          <ScoreComponent
            title="Consistency"
            weight={SCORE.W_CONS}
            formula="Consistency = 1 / (1 + Return_Std_30d)"
            description="Measures trading consistency over the last 30 days. Lower volatility (standard deviation) results in higher consistency scores."
            example="If return std is 0.5, consistency = 1 / (1 + 0.5) = 0.67 (67%)"
            color="bg-blue-100 text-blue-800"
          />
          
          <ScoreComponent
            title="Volume"
            weight={SCORE.W_VOL}
            formula="Volume = log(1 + Notional_30d) / log(1 + VOL_NORM)"
            description="Measures trading activity over the last 30 days. Uses logarithmic scaling to prevent extremely high volumes from dominating the score."
            example="If notional is $25,000 and VOL_NORM is $50,000, volume = log(26,000) / log(51,000) ≈ 0.85 (85%)"
            color="bg-purple-100 text-purple-800"
          />
          
          <ScoreComponent
            title="Recency"
            weight={SCORE.W_REC}
            formula="Recency = Σ(Weight_i × Accuracy_i) where Weight_i = exp(-k × Days_i)"
            description="Measures recent performance with exponential decay. More recent predictions have higher weight. Half-life is 14 days."
            example="Recent high-accuracy predictions contribute more than older ones, with weights decreasing exponentially over time."
            color="bg-orange-100 text-orange-800"
          />
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Provisional Scores</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Creators with fewer than <strong>{SCORE.PROVISIONAL_THRESHOLD} matured insights</strong> 
                have their scores marked as "Provisional".
              </p>
              <p className="text-sm text-gray-600">
                This indicates that the score may not be statistically reliable due to limited data.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Provisional scores are still calculated using the same formula, 
                  but they should be interpreted with caution.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Interpretation</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">90-100%</span>
                <span className="text-sm font-medium text-green-600">Excellent</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">70-89%</span>
                <span className="text-sm font-medium text-blue-600">Good</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">50-69%</span>
                <span className="text-sm font-medium text-yellow-600">Fair</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">0-49%</span>
                <span className="text-sm font-medium text-red-600">Needs Improvement</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Constants</h4>
              <ul className="space-y-1">
                <li>• VOL_NORM: {SCORE.VOL_NORM.toLocaleString()} USDC</li>
                <li>• Half-life: {SCORE.HALF_LIFE_DAYS} days</li>
                <li>• Provisional threshold: {SCORE.PROVISIONAL_THRESHOLD} insights</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Data Sources</h4>
              <ul className="space-y-1">
                <li>• Accuracy: Resolved predictions only</li>
                <li>• Consistency: 30-day trading returns</li>
                <li>• Volume: 30-day notional volume</li>
                <li>• Recency: Daily accuracy scores</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
