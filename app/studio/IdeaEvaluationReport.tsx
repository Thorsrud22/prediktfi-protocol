'use client';

import React from 'react';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';

interface IdeaEvaluationReportProps {
    result: IdeaEvaluationResult;
    onEdit: () => void;
    onStartNew: () => void;
}

export default function IdeaEvaluationReport({ result, onEdit, onStartNew }: IdeaEvaluationReportProps) {
    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-green-400';
        if (score >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 75) return 'bg-green-500/20 border-green-500/50';
        if (score >= 50) return 'bg-yellow-500/20 border-yellow-500/50';
        return 'bg-red-500/20 border-red-500/50';
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                <h2 className="text-3xl font-bold text-white mb-2">Evaluation Result</h2>
                <p className="text-blue-200 text-lg mb-6">{result.overallVerdict}</p>

                <div className="flex justify-center items-center gap-8">
                    <div className="text-center">
                        <div className={`text-5xl font-bold mb-1 ${getScoreColor(result.successProbability)}`}>
                            {result.successProbability}%
                        </div>
                        <div className="text-sm text-blue-300 uppercase tracking-wider font-semibold">Success Probability</div>
                    </div>

                    <div className="w-px h-16 bg-white/10"></div>

                    <div className="text-center">
                        <div className="text-5xl font-bold mb-1 text-blue-400">
                            {Math.round(result.confidenceScore * 100)}%
                        </div>
                        <div className="text-sm text-blue-300 uppercase tracking-wider font-semibold">AI Confidence</div>
                    </div>
                </div>
            </div>

            {/* Detailed Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pros */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                    <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center">
                        <span className="mr-2">✅</span> Strengths
                    </h3>
                    <ul className="space-y-3">
                        {result.pros.map((item, index) => (
                            <li key={index} className="flex items-start text-gray-300">
                                <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Cons */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                    <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center">
                        <span className="mr-2">⚠️</span> Risks & Challenges
                    </h3>
                    <ul className="space-y-3">
                        {result.cons.map((item, index) => (
                            <li key={index} className="flex items-start text-gray-300">
                                <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Improvements */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                    <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                        <span className="mr-2">💡</span> Strategic Pivots
                    </h3>
                    <ul className="space-y-3">
                        {result.improvements.map((item, index) => (
                            <li key={index} className="flex items-start text-gray-300">
                                <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Risk Analysis */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                    <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center">
                        <span className="mr-2">🛡️</span> Risk Analysis
                    </h3>
                    <ul className="space-y-3">
                        {result.riskAnalysis.map((item, index) => (
                            <li key={index} className="flex items-start text-gray-300">
                                <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0"></span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4 pt-4">
                <button
                    onClick={onEdit}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-lg transition-all font-medium"
                >
                    ← Edit Idea
                </button>
                <button
                    onClick={onStartNew}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-blue-500/20"
                >
                    Start New Evaluation
                </button>
            </div>
        </div>
    );
}
