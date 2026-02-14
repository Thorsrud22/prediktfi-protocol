'use client';

import { useMemo, useState } from 'react';
import { SCORE_THRESHOLDS, SCORE_LABELS, LIMITS } from './report/constants';
import { useReportData } from './report/hooks/useReportData';
import { Header } from './report/components/Header';
import { VerdictPanel } from './report/components/VerdictPanel';
import { AiStrategyPanel } from './report/components/AiStrategyPanel';
import { TrustPanel } from './report/components/TrustPanel';
import { CommitteeDebate } from './report/components/CommitteeDebate';
import { RedFlags } from './report/components/RedFlags';
import { ReportFooter } from './report/components/ReportFooter';
import { PerformanceRadar } from './report/components/PerformanceRadar';
import { ActionPlan } from './report/components/ActionPlan';
import { MarketIntelligence } from './report/components/MarketIntelligence';
import { ClaimsEvidence } from './report/components/ClaimsEvidence';
import { ThreatDetection } from './report/components/ThreatDetection';
import { SecurityChecks } from './report/components/SecurityChecks';
import { AiReasoning } from './report/components/AiReasoning';
import { ReportSectionErrorBoundary } from './report/components/ReportSectionErrorBoundary';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import {
    TriangleAlert as AlertTriangle,
    Terminal,
    Shield,
    CircleCheck as CheckCircle2,
    ArrowLeft,
    Sparkles,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useToast } from '../components/ToastProvider';

const KeyStatsBar = dynamic(() => import('../components/charts/KeyStatsBar'), {
    loading: () => <div className="w-full h-12 bg-white/5 animate-pulse rounded-lg" />,
    ssr: false
});
import { useSimplifiedWallet } from '../components/wallet/SimplifiedWalletProvider';
import { printElement } from '../utils/print';





interface IdeaEvaluationReportProps {
    result: IdeaEvaluationResult;
    onEdit?: () => void;
    onStartNew?: () => void;
    ownerAddress?: string;
    isExample?: boolean;
    evalId?: string | null;
    onCommit?: () => void;
    commitStatus?: 'idle' | 'committing' | 'success' | 'error';
}



export default function IdeaEvaluationReport({ result, onEdit, onStartNew, ownerAddress, isExample, evalId, onCommit, commitStatus = 'idle' }: IdeaEvaluationReportProps) {
    const { publicKey } = useSimplifiedWallet();

    const {
        chartData,
        riskScore,
        redFlags,
        keyStats,
        evidenceCoveragePct,
        claimEvidenceRows,
        committeeDebate
    } = useReportData(result);



    // Check ownership
    const isOwner = useMemo(() => {
        if (isExample) return false; // Examples are never owned by viewer in the sense of editing/generating
        if (!ownerAddress) return true; // Legacy/Local reports might not have owner, assume allowed or handle elsewhere?
        // Actually, if it's public link, best to default false if not verified.
        // But for "Studio" use (parent passes no ownerAddress?), we assume owner.
        // Let's assume if ownerAddress is provided, we MUST match.
        if (publicKey === ownerAddress) return true;
        return false;
    }, [publicKey, ownerAddress, isExample]);








    const getScoreColor = (score: number) => {
        if (score >= SCORE_THRESHOLDS.GOOD) return 'text-emerald-400';
        if (score >= SCORE_THRESHOLDS.PASS) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreLabel = (score: number) => {
        if (score >= SCORE_THRESHOLDS.STRONG) return SCORE_LABELS.STRONG;
        if (score >= SCORE_THRESHOLDS.WATCHLIST) return SCORE_LABELS.WATCHLIST;
        return SCORE_LABELS.PASS;
    };

    const getScoreBadgeClass = (score: number) => {
        if (score >= SCORE_THRESHOLDS.STRONG) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (score >= SCORE_THRESHOLDS.WATCHLIST) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    };





    return (
        <div className="w-full max-w-5xl mx-auto font-sans text-sm leading-relaxed">
            {/* Styles moved to global CSS */}

            <div id="printable-report" className="bg-slate-900 border border-white/5 p-6 md:p-8 relative overflow-visible rounded-3xl shadow-2xl text-white flex flex-col">

                {/* ========== STICKY HEADER BAR ========== */}
                <Header result={result} evalId={evalId} />

                {/* ========== ABOVE THE FOLD: COMMAND CENTER ========== */}
                <ReportSectionErrorBoundary sectionName="Verdict">
                    <VerdictPanel result={result} riskScore={riskScore} />
                </ReportSectionErrorBoundary>

                {/* ========== TRUST PANEL ========== */}
                <ReportSectionErrorBoundary sectionName="Trust Score">
                    <TrustPanel result={result} evidenceCoveragePct={evidenceCoveragePct} />
                </ReportSectionErrorBoundary>

                {/* ========== INVESTMENT COMMITTEE DEBATE ========== */}
                <ReportSectionErrorBoundary sectionName="Committee Debate">
                    <CommitteeDebate committeeDebate={committeeDebate} />
                </ReportSectionErrorBoundary>

                {/* ========== RED FLAG BOX ========== */}
                <ReportSectionErrorBoundary sectionName="Red Flags">
                    <RedFlags redFlags={redFlags} />
                </ReportSectionErrorBoundary>

                {/* ========== KEY STATS BAR ========== */}
                <KeyStatsBar stats={keyStats} className="mb-10" />

                {/* ========== BELOW THE FOLD: DEEP DIVES ========== */}

                {/* RADAR CHART + ACTION PLAN - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    <ReportSectionErrorBoundary sectionName="Performance Radar">
                        <PerformanceRadar chartData={chartData} />
                    </ReportSectionErrorBoundary>
                    <ReportSectionErrorBoundary sectionName="Action Plan">
                        <ActionPlan recommendations={result.recommendations?.mustFixBeforeBuild} />
                    </ReportSectionErrorBoundary>
                </div>

                {/* MARKET INTELLIGENCE */}
                <ReportSectionErrorBoundary sectionName="Market Intelligence">
                    <MarketIntelligence market={result.market} />
                </ReportSectionErrorBoundary>

                {/* CLAIMS & EVIDENCE TABLE */}
                <ReportSectionErrorBoundary sectionName="Claims Evidence">
                    <ClaimsEvidence claimEvidenceRows={claimEvidenceRows} />
                </ReportSectionErrorBoundary>

                {/* THREAT DETECTION + CALIBRATION (2-col grid) */}
                <ReportSectionErrorBoundary sectionName="Threat Detection">
                    <ThreatDetection result={result} />
                </ReportSectionErrorBoundary>

                {/* SECURITY / CRYPTO-NATIVE CHECKS GRID */}
                <ReportSectionErrorBoundary sectionName="Security Checks">
                    <SecurityChecks cryptoNativeChecks={result.cryptoNativeChecks} />
                </ReportSectionErrorBoundary>

                {/* AI STRATEGY DEEP DIVE (Only for AI projects) */}
                {result.projectType === 'ai' && result.aiStrategy && (
                    <AiStrategyPanel aiStrategy={result.aiStrategy} />
                )}

                {/* AI REASONING CHAIN - collapsible */}
                <AiReasoning reasoningSteps={result.reasoningSteps} />

                {/* ACTION PANEL - "Next Best Action" */}
                <div className="mt-12 border border-blue-900/30 bg-[#0f172a] rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 noprint">

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                            <Image src="/images/logo.png" width={20} height={20} alt="Predikt" className="object-contain" />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-wide uppercase">Recommended Next Steps</h3>
                    </div>

                    <ReportFooter
                        result={result}
                        evalId={evalId}
                        onEdit={onEdit}
                        onCommit={onCommit}
                        commitStatus={commitStatus}
                        onStartNew={onStartNew}
                    />

                    {/* Footer for Start New if not visible in grid */}
                    {onStartNew && onCommit && (
                        <div className="mt-6 text-center border-t border-white/5 pt-4">
                            <button
                                onClick={onStartNew}
                                className="text-xs text-white/30 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto group"
                            >
                                <Sparkles size={12} className="group-hover:text-cyan-400 transition-colors" /> Start New Evaluation
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div >
    );
}
