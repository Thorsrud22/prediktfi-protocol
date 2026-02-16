'use client';

import React, { useState } from 'react';
import type {
    IdeaEvaluationResult,
    StructuredAnalysisData,
} from '@/lib/ideaEvaluationTypes';
import { getScoreColor10 } from '../utils';

// ---------------------------------------------------------------------------
// Inline SVG icons – avoids lucide-react barrel import inside dynamic() chunk
// ---------------------------------------------------------------------------

const iconClass = "w-4 h-4";
const strokeProps = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

function ChevronDown({ className }: { className?: string }) {
    return <svg className={className || iconClass} viewBox="0 0 24 24" {...strokeProps}><polyline points="6 9 12 15 18 9" /></svg>;
}
function ChevronRight({ className }: { className?: string }) {
    return <svg className={className || iconClass} viewBox="0 0 24 24" {...strokeProps}><polyline points="9 18 15 12 9 6" /></svg>;
}
function BrainIcon({ className }: { className?: string }) {
    return <svg className={className || iconClass} viewBox="0 0 24 24" {...strokeProps}><path d="M12 2a5 5 0 0 1 4.5 2.8A4 4 0 0 1 20 9a4 4 0 0 1-1.5 3.1A5 5 0 0 1 12 22a5 5 0 0 1-6.5-9.9A4 4 0 0 1 4 9a4 4 0 0 1 3.5-4.2A5 5 0 0 1 12 2z" /><path d="M12 2v20" /></svg>;
}
function AlertTriangleIcon({ className }: { className?: string }) {
    return <svg className={className || iconClass} viewBox="0 0 24 24" {...strokeProps}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}
function TargetIcon({ className }: { className?: string }) {
    return <svg className={className || iconClass} viewBox="0 0 24 24" {...strokeProps}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
}
function CpuIcon({ className }: { className?: string }) {
    return <svg className={className || iconClass} viewBox="0 0 24 24" {...strokeProps}><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>;
}
function ShieldIcon({ className }: { className?: string }) {
    return <svg className={className || iconClass} viewBox="0 0 24 24" {...strokeProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
function RocketIcon({ className }: { className?: string }) {
    return <svg className={className || iconClass} viewBox="0 0 24 24" {...strokeProps}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>;
}

// ---------------------------------------------------------------------------
// Dimension configuration
// ---------------------------------------------------------------------------

type DimensionKey = keyof Pick<
    StructuredAnalysisData,
    'marketOpportunity' | 'technicalFeasibility' | 'competitiveMoat' | 'executionReadiness'
>;

const DIMENSIONS: {
    key: DimensionKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}[] = [
        { key: 'marketOpportunity', label: 'Market Opportunity', icon: TargetIcon },
        { key: 'technicalFeasibility', label: 'Technical Feasibility', icon: CpuIcon },
        { key: 'competitiveMoat', label: 'Competitive Moat', icon: ShieldIcon },
        { key: 'executionReadiness', label: 'Execution Readiness', icon: RocketIcon },
    ];

// ---------------------------------------------------------------------------
// DimensionCard
// ---------------------------------------------------------------------------

interface DimensionCardProps {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    dimension: {
        score: number;
        evidence: string[];
        reasoning: string;
        uncertainty: string;
    };
}

function DimensionCard({ label, icon: Icon, dimension }: DimensionCardProps) {
    const [evidenceOpen, setEvidenceOpen] = useState(false);
    const { score, reasoning, evidence, uncertainty } = dimension;
    const color = getScoreColor10(score);

    return (
        <div className="border border-blue-900/30 bg-slate-900/50 rounded-xl p-4 flex flex-col gap-3">
            {/* ---- Header: icon + label + numeric score ---- */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                        {label}
                    </span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${color.text}`}>
                    {score.toFixed(1)}<span className="text-white/20 font-normal">/10</span>
                </span>
            </div>

            {/* ---- Score bar ---- */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${color.bg}`}
                    style={{ width: `${Math.min((score / 10) * 100, 100)}%` }}
                />
            </div>

            {/* ---- Reasoning ---- */}
            {reasoning && (
                <p className="text-xs text-white/50 leading-relaxed">{reasoning}</p>
            )}

            {/* ---- Evidence (collapsible) ---- */}
            {evidence && evidence.length > 0 && (
                <div>
                    <button
                        type="button"
                        onClick={() => setEvidenceOpen((o) => !o)}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-blue-400/70 hover:text-blue-400 transition-colors"
                    >
                        {evidenceOpen ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )}
                        Evidence ({evidence.length})
                    </button>

                    {evidenceOpen && (
                        <ul className="mt-2 space-y-1.5 pl-4">
                            {evidence.map((item, i) => (
                                <li
                                    key={i}
                                    className="text-xs text-white/40 leading-relaxed list-disc marker:text-blue-900/50"
                                >
                                    {item}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* ---- Uncertainty callout ---- */}
            {uncertainty && (
                <div className="border border-amber-900/30 bg-amber-950/30 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500/70 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-200/60 leading-relaxed">{uncertainty}</p>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// StructuredAnalysis (exported)
// ---------------------------------------------------------------------------

interface StructuredAnalysisProps {
    result: IdeaEvaluationResult;
}

export function StructuredAnalysis({ result }: StructuredAnalysisProps) {
    const { structuredAnalysisData, structuredAnalysis } = result;

    // ---- Fallback: legacy markdown string (old cached results / model edge cases) ----
    if (!structuredAnalysisData) {
        if (!structuredAnalysis) return null;

        return (
            <div className="border border-blue-900/30 bg-slate-900 p-6 rounded-2xl mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <BrainIcon className="w-5 h-5 text-blue-400" />
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
                        Structured Analysis
                    </h3>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-white/60">
                    <pre className="whitespace-pre-wrap text-xs text-white/50 font-sans leading-relaxed">
                        {structuredAnalysis}
                    </pre>
                </div>
            </div>
        );
    }

    // ---- Primary path: render from typed data ----
    const overall = structuredAnalysisData.overall;

    return (
        <div className="border border-blue-900/30 bg-slate-900 p-6 rounded-2xl mb-8">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-6">
                <BrainIcon className="w-5 h-5 text-blue-400" />
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
                    Structured Analysis Deep Dive
                </h3>
            </div>

            {/* 2x2 dimension grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {DIMENSIONS.map(({ key, label, icon }) => {
                    const dim = structuredAnalysisData[key];
                    if (!dim) return null;
                    return (
                        <DimensionCard key={key} label={label} icon={icon} dimension={dim} />
                    );
                })}
            </div>

            {/* Overall synthesis */}
            {overall && (
                <div className="border-t border-blue-900/20 pt-4 space-y-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                        Synthesis
                    </span>

                    {overall.composition && (
                        <SynthesisRow label="Formula">
                            <code className="text-xs text-blue-300/70 bg-slate-800/50 px-2 py-1 rounded font-mono">
                                {overall.composition}
                            </code>
                        </SynthesisRow>
                    )}

                    {overall.confidence && (
                        <SynthesisRow label="Confidence">
                            <span className={`text-xs font-bold uppercase ${overall.confidence === 'HIGH' ? 'text-emerald-400' :
                                overall.confidence === 'MEDIUM' ? 'text-amber-400' :
                                    'text-red-400'
                                }`}>
                                {overall.confidence}
                            </span>
                        </SynthesisRow>
                    )}

                    {typeof overall.finalScore === 'number' && (
                        <SynthesisRow label="Final Score">
                            <span className={`text-xs font-bold ${getScoreColor10(overall.finalScore).text}`}>
                                {overall.finalScore}/10
                            </span>
                        </SynthesisRow>
                    )}

                    {overall.topRisk && (
                        <SynthesisRow label="Top Risk">
                            <span className="text-xs text-amber-300/60">
                                {overall.topRisk}
                            </span>
                        </SynthesisRow>
                    )}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Small helper for the synthesis key-value rows
// ---------------------------------------------------------------------------

function SynthesisRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-2">
            <span className="text-[10px] uppercase tracking-widest text-white/30 shrink-0 mt-0.5 w-24">
                {label}
            </span>
            {children}
        </div>
    );
}
