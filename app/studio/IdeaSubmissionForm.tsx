'use client';

import React, { useState, useEffect } from 'react';
import { ideaSubmissionSchema, IdeaSubmission } from '@/lib/ideaSchema';
import { z } from 'zod';
import {
    Rocket,
    Target,
    Users,
    Settings2,
    Lightbulb,
    X,
    ChevronDown,
    ChevronUp,
    CircleCheck as CheckCircle2,
    CircleAlert as AlertCircle
} from 'lucide-react';

interface IdeaSubmissionFormProps {
    onSubmit: (data: IdeaSubmission) => void;
    isSubmitting: boolean;
    initialData?: Partial<IdeaSubmission>;
    quota?: { limit: number; remaining: number } | null;
    streamingSteps?: string[];
    streamingThoughts?: string; // CHANGED: Now a single string buffer
    isConnected?: boolean;
    onConnect?: () => void;
    error?: string | null;
}


// ------------------------------------------------------------------
// REASONING TERMINAL COMPONENT - SCI-FI COMMAND CENTER
// ------------------------------------------------------------------
// Now displays ONLY real logs from the backend (no fake noise)

interface LogEntry {
    text: string;
    type: 'step' | 'thought';
    timestamp: string;
}

function ReasoningTerminal({ projectType, streamingSteps, streamingThoughts, error }: { projectType?: string; streamingSteps?: string[]; streamingThoughts?: string; error?: string | null }) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [startTime] = useState(() => Date.now());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [displayProgress, setDisplayProgress] = useState(0); // Animated progress state
    const [spinnerIndex, setSpinnerIndex] = useState(0); // For spinning cursor
    const processedStepsRef = React.useRef<number>(0);
    const processedThoughtsRef = React.useRef<number>(0);

    // Spinner characters for active line
    const SPINNER_CHARS = ['|', '/', '-', '\\'];

    // Update elapsed time and spinner
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
            setSpinnerIndex(prev => (prev + 1) % 4);
        }, 250); // Faster for spinner animation
        return () => clearInterval(interval);
    }, [startTime]);

    // Get current timestamp
    const getTimestamp = () => new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Streaming Logic - displays Steps AND Thoughts
    useEffect(() => {
        const hasSteps = streamingSteps && streamingSteps.length > 0;
        const hasThoughts = streamingThoughts && streamingThoughts.length > 0;

        if (!hasSteps && !hasThoughts) {
            if (logs.length === 0) setLogs([{ text: 'Initializing PrediktFi Evaluator...', type: 'step', timestamp: getTimestamp() }]);
            // Continue to check for error
        }

        const newEntries: LogEntry[] = [];

        // Process new STEPS
        if (streamingSteps) {
            const newSteps = streamingSteps.slice(processedStepsRef.current);
            newSteps.forEach(step => {
                newEntries.push({ text: step, type: 'step', timestamp: getTimestamp() });
            });
            processedStepsRef.current = streamingSteps.length;
        }

        // Process new THOUGHTS (from string buffer)
        if (streamingThoughts) {
            // Split by newline to get lines
            const allThoughtLines = streamingThoughts.split('\n');

            // Only add NEW lines that haven't been processed yet
            const newThoughts = allThoughtLines.slice(processedThoughtsRef.current);

            if (newThoughts.length > 0) {
                newThoughts.forEach((thought, idx) => {
                    // If it's the very last line and it's not empty, we ignore it for now 
                    // unless it's the ONLY line we have. 
                    // Actually, we want to show the typing effect! 
                    // But splitting by newline means the last element is the "current" line.

                    // Optimization: Only push non-empty lines, or update the *last* log entry if it's incomplete?
                    // For simplicity/stability: Just push everything that is non-empty.
                    // The "vertical text" bug happened because we pushed char-by-char. 
                    // Now we push line-by-line.

                    if (thought.trim()) {
                        newEntries.push({ text: thought, type: 'thought', timestamp: getTimestamp() });
                    }
                });
                // We processed all lines provided in this batch
                processedThoughtsRef.current = allThoughtLines.length;
            }
        }

        if (newEntries.length > 0) {
            setLogs(prev => [...prev, ...newEntries]);
        }
    }, [streamingSteps, streamingThoughts]);

    // Error Handling Effect
    useEffect(() => {
        if (error) {
            setLogs(prev => [
                ...prev,
                { text: `CRITICAL FAILURE: ${error}`, type: 'step', timestamp: getTimestamp() },
                { text: 'System halted.', type: 'step', timestamp: getTimestamp() }
            ]);
        }
    }, [error]);


    // Auto-scroll
    const bottomRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (bottomRef.current?.scrollIntoView) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    // Keyword definitions for highlighting
    const HIGHLIGHT_KEYWORDS: Array<{ words: string[]; className: string }> = [
        { words: ['CoinGecko', 'Birdeye', 'DexScreener'], className: 'text-cyan-400 font-bold' },
        { words: ['AI', 'GPT', 'LLM', 'Model'], className: 'text-emerald-400 font-bold' },
        { words: ['Solana', 'SOL', 'ETH', 'Ethereum', 'BTC', 'Bitcoin'], className: 'text-amber-400 font-bold' },
        { words: ['Risk', 'Warning', 'Critical', 'Error'], className: 'text-red-400 font-bold' },
        { words: ['Score', 'Analysis', 'Evaluation'], className: 'text-blue-400' },
        { words: ['OK', 'PASS', 'CLEAR', 'SUCCESS'], className: 'text-emerald-400' },
    ];

    // Parse text and return React elements with highlighted keywords
    const parseTextWithHighlights = (text: string): React.ReactNode[] => {
        // Build a single regex pattern for all keywords
        const allKeywords = HIGHLIGHT_KEYWORDS.flatMap(k => k.words);
        const pattern = new RegExp(`\\b(${allKeywords.join('|')})\\b`, 'gi');

        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;
        let keyIndex = 0;

        // Reset regex state
        pattern.lastIndex = 0;

        while ((match = pattern.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }

            // Find the matching keyword group for styling
            const matchedWord = match[1];
            const keywordGroup = HIGHLIGHT_KEYWORDS.find(k =>
                k.words.some(w => w.toLowerCase() === matchedWord.toLowerCase())
            );

            // Add the highlighted keyword as a React element
            parts.push(
                <span key={`kw-${keyIndex++}`} className={keywordGroup?.className || ''}>
                    {matchedWord}
                </span>
            );

            lastIndex = pattern.lastIndex;
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts.length > 0 ? parts : [text];
    };

    // Render a log entry with proper React components
    const renderColoredLog = (text: string, isComplete: boolean) => {
        return (
            <span className="flex items-center gap-2">
                <span>{parseTextWithHighlights(text)}</span>
                {isComplete && (
                    <span className="text-emerald-400 font-bold text-[10px] tracking-wider">[DONE]</span>
                )}
            </span>
        );
    };

    // Progress calculation based on log count (steps count more)
    const stepCount = logs.filter(l => l.type === 'step').length;
    // Thoughts shouldn't jump progress too fast, but indicate activity
    const estimatedTotalSteps = 8;
    const targetProgress = Math.min((stepCount / estimatedTotalSteps) * 100, 95);

    // Animate progress smoothly toward target
    useEffect(() => {
        if (displayProgress < targetProgress) {
            const timer = setTimeout(() => {
                // Ease-out animation: faster when far, slower when close
                const diff = targetProgress - displayProgress;
                const step = Math.max(1, diff * 0.15);
                setDisplayProgress(prev => Math.min(prev + step, targetProgress));
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [displayProgress, targetProgress]);

    // Format elapsed time as MM:SS
    const formatElapsed = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-[500px] flex flex-col font-mono text-xs md:text-sm bg-slate-950 backdrop-blur-md rounded-xl border border-white/10 relative overflow-hidden shadow-2xl">
            {/* CRT Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)',
            }} />

            {/* MacOS-style Title Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-white/5 relative z-20">
                {/* Traffic Light Buttons */}
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-default shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-default shadow-inner" />
                    <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-default shadow-inner" />
                </div>

                {/* Centered Title */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
                    <span className="text-white/60 text-xs font-medium tracking-wide">prediktfi — evaluation</span>
                </div>

                {/* Right Side Stats */}
                <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-emerald-400/80">{displayProgress.toFixed(0)}%</span>
                    <span className="text-white/30">T+{formatElapsed(elapsedSeconds)}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-slate-800 relative overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                    style={{ width: `${displayProgress}%` }}
                />
            </div>

            <div className="p-5 flex-1 flex flex-col relative z-20 overflow-hidden">

                {/* Log Output - Shows ALL history with auto-scroll */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-cyan-500/20">
                    {logs.map((log, i) => {
                        const isLast = i === logs.length - 1;
                        const isComplete = !isLast && log.type === 'step';
                        const isThought = log.type === 'thought';

                        return (
                            <div
                                key={i}
                                className={`flex gap-2 animate-in fade-in duration-75 ${isThought ? 'pl-4 border-l border-white/5 ml-1' : ''}`}
                            >
                                <span className={`select-none font-mono text-[9px] min-w-[52px] ${isThought ? 'text-white/20' : 'text-slate-700'}`}>
                                    {log.timestamp}
                                </span>
                                <span className={`select-none ${isThought ? 'text-white/20' : 'text-cyan-500/50'}`}>
                                    {'>'}
                                </span>
                                <span className={
                                    isThought
                                        ? 'text-white/40 italic font-mono tracking-tight' // Thoughts styling
                                        : isComplete
                                            ? 'text-white/70'
                                            : 'text-white' // Step styling
                                }>
                                    {renderColoredLog(log.text, isComplete)}
                                    {/* Spinning cursor on active (last) log */}
                                    {isLast && (
                                        <span className="text-cyan-400 ml-2 font-bold">
                                            {SPINNER_CHARS[spinnerIndex]}
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    })}

                    {/* Aggressive Blinking Cursor */}
                    <div className="flex gap-2 items-center">
                        <span className="text-slate-700 select-none font-mono text-[9px] min-w-[52px]">
                            {getTimestamp()}
                        </span>
                        <span className="text-cyan-500/50 select-none">{'>'}</span>
                        <span className="text-cyan-400 animate-[blink_0.4s_infinite] font-bold text-lg">_</span>
                    </div>
                    <div ref={bottomRef} />
                </div>

                {/* Hanging Perception Fix: Reassurance Message */}
                {(streamingSteps && streamingSteps.length > 0) || (streamingThoughts && streamingThoughts.length > 0) ? (
                    <div className="px-4 py-2 bg-slate-900/50 border-t border-cyan-500/10 text-center animate-pulse">
                        <p className="text-[10px] text-cyan-400/70 font-mono">
                            Deep reasoning takes ~120s. Please wait.
                        </p>
                    </div>
                ) : null}

                {/* Footer Status Bar */}
                <div className="pt-3 border-t border-cyan-500/10 flex justify-between items-center text-[9px] uppercase tracking-[0.15em] px-4 pb-2">
                    <span className="text-cyan-500/40">LOGS: <span className="text-cyan-400">{logs.length}</span></span>
                    <span className="text-cyan-500/40">
                        STATUS: <span className={streamingSteps && streamingSteps.length > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                            {streamingSteps && streamingSteps.length > 0 ? 'STREAMING' : error ? 'FAILURE' : 'CONNECTING...'}
                        </span>
                    </span>
                    <span className="text-cyan-500/40">NET: <span className={error ? "text-red-500" : "text-emerald-400"}>{error ? "OFFLINE" : "ENCRYPTED"}</span></span>
                </div>
            </div>

            {/* Keyframes for aggressive blink */}
            <style jsx>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}


export default function IdeaSubmissionForm({ onSubmit, isSubmitting, initialData, quota, streamingSteps, streamingThoughts, isConnected, onConnect, error }: IdeaSubmissionFormProps) {
    // Consolidated State
    const [formData, setFormData] = useState<Partial<IdeaSubmission>>(initialData || {
        description: '',
        projectType: 'ai',

        // Advanced / Optional Defaults
        teamSize: 'solo',
        resources: [],
        successDefinition: 'Launch and learn',
        attachments: '',
        responseStyle: 'balanced',
        focusHints: [],
        mvpScope: 'Standard MVP',
        goToMarketPlan: 'Organic Growth',
        launchLiquidityPlan: 'Not yet decided',
        tokenAddress: '',

        defiSecurityMarks: [],
        memecoinLaunchPreparation: [],
        aiInfraReadiness: [],
        targetTVL: '',
        targetMarketCap: '',
        targetDAU: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Coach Tip Logic
    const [coachTip, setCoachTip] = useState<string | null>(null);
    const [isCoaching, setIsCoaching] = useState(false);

    useEffect(() => {
        if (!formData.description || formData.description.length < 20) {
            setCoachTip(null);
            return;
        }

        const timer = setTimeout(async () => {
            if (!isConnected) {
                setCoachTip(null);
                return;
            }

            setIsCoaching(true);
            try {
                const res = await fetch('/api/idea-evaluator/copilot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: formData.description,
                        field: 'description',
                        projectType: formData.projectType
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.suggestion) {
                        setCoachTip(data.suggestion);
                    }
                }
            } catch (e) {
                console.error("Coach error", e);
            } finally {
                setIsCoaching(false);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [formData.description, isConnected, formData.projectType]);

    // Handlers
    const handleChange = (field: keyof IdeaSubmission, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const toggleArrayItem = (field: keyof IdeaSubmission, item: string) => {
        const currentItems = (formData[field] as string[]) || [];
        const newItems = currentItems.includes(item)
            ? currentItems.filter((i) => i !== item)
            : [...currentItems, item];
        handleChange(field, newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Simple Validation
        if (!formData.description || formData.description.length < 10) {
            setErrors({ description: "Please provide a more detailed description (min 10 chars)." });
            return;
        }

        if (!formData.projectType) {
            setErrors({ projectType: "Please select a project sector." });
            return;
        }

        // Use Zod for final cleanup/defaults, but don't block on optional fields
        try {
            const validatedData = ideaSubmissionSchema.parse(formData);
            onSubmit(validatedData);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error("Submission Schema Error", error);
                // Fallback: Just submit what we have if strict schema check fails on something trivial
                // (Though schema should handle defaults). 
                // Just in case, block only if critical:
                onSubmit(formData as IdeaSubmission);
            }
        }
    };

    // Render Logic
    if (isSubmitting || error) {
        return (
            <div className={`w-full max-w-4xl mx-auto bg-slate-900/95 border ${error ? 'border-red-500/30' : 'border-white/10'} shadow-xl rounded-xl relative overflow-hidden font-sans animate-in fade-in duration-500`}>
                <ReasoningTerminal projectType={formData.projectType} streamingSteps={streamingSteps} streamingThoughts={streamingThoughts} error={error} />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* MAIN CARD */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-2xl rounded-[32px] overflow-hidden p-6 sm:p-8 relative">

                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-2">What are you building?</h2>
                    <p className="text-white/40 text-sm">Describe your idea to get an investor-grade evaluation.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: TYPE */}
                    <div className="lg:col-span-4 space-y-6">
                        <div>
                            <label className="block text-white/60 mb-3 text-[10px] font-black uppercase tracking-[0.2em] italic border-l-2 border-blue-500 pl-3">
                                Sector <span className="text-blue-400 ml-1">*</span>
                            </label>
                            <div className="space-y-4">
                                {/* Hierarchical Selection */}
                                {/* Explicit 3-Option Selection */}
                                <div className="space-y-3">
                                    {/* Option 1: Memecoin */}
                                    <button
                                        type="button"
                                        onClick={() => handleChange('projectType', 'memecoin')}
                                        className={`w-full p-4 text-left rounded-xl border transition-all relative overflow-hidden group ${formData.projectType === 'memecoin'
                                            ? 'bg-blue-500/10 border-blue-500/50 text-white ring-1 ring-blue-500/20'
                                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'}`}
                                    >
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-bold text-sm ${formData.projectType === 'memecoin' ? 'text-white' : 'text-white/60'}`}>Memecoin</span>
                                                </div>
                                                <span className="text-[10px] opacity-50 uppercase tracking-widest block">Viral • Narrative • Hype</span>
                                            </div>
                                            {formData.projectType === 'memecoin' && <CheckCircle2 size={18} className="text-blue-400" />}
                                        </div>
                                    </button>

                                    {/* Option 2: DeFi / Utility */}
                                    <button
                                        type="button"
                                        onClick={() => handleChange('projectType', 'defi')}
                                        className={`w-full p-4 text-left rounded-xl border transition-all relative overflow-hidden group ${formData.projectType === 'defi'
                                            ? 'bg-blue-500/10 border-blue-500/50 text-white ring-1 ring-blue-500/20'
                                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'}`}
                                    >
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-bold text-sm ${formData.projectType === 'defi' ? 'text-white' : 'text-white/60'}`}>DeFi & Utility</span>
                                                </div>
                                                <span className="text-[10px] opacity-50 uppercase tracking-widest block">Yield • Protocol • Tech</span>
                                            </div>
                                            {formData.projectType === 'defi' && <CheckCircle2 size={18} className="text-blue-400" />}
                                        </div>
                                    </button>

                                    {/* Option 3: AI Agent */}
                                    <button
                                        type="button"
                                        onClick={() => handleChange('projectType', 'ai')}
                                        className={`w-full p-4 text-left rounded-xl border transition-all relative overflow-hidden group ${formData.projectType === 'ai'
                                            ? 'bg-blue-500/10 border-blue-500/50 text-white ring-1 ring-blue-500/20'
                                            : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'}`}
                                    >
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-bold text-sm ${formData.projectType === 'ai' ? 'text-white' : 'text-white/60'}`}>AI Agent</span>
                                                </div>
                                                <span className="text-[10px] opacity-50 uppercase tracking-widest block">LLM • Infrastructure</span>
                                            </div>
                                            {formData.projectType === 'ai' && <CheckCircle2 size={18} className="text-blue-400" />}
                                        </div>
                                    </button>
                                </div>

                            </div>
                        </div>

                        {/* Coach Tip */}
                        {(coachTip || isCoaching) && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-4 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -skew-x-12 animate-shimmer" />
                                    <div className="relative z-10 flex gap-3">
                                        <div className="mt-1">
                                            {isCoaching ? (
                                                <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                            ) : (
                                                <Lightbulb size={16} className="text-blue-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1">
                                                    {isCoaching ? 'Analyzing Pitch...' : 'Copilot Tip'}
                                                </h4>
                                                {!isCoaching && coachTip !== 'LOCKED' && (
                                                    <button onClick={() => setCoachTip(null)} className="text-white/20 hover:text-white">
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            {coachTip === 'LOCKED' && !isConnected ? (
                                                <div onClick={() => onConnect?.()} className="cursor-pointer group">
                                                    <p className="text-xs text-blue-100/40 blur-sm select-none">Hidden tip regarding your narrative.</p>
                                                    <div className="mt-2 text-blue-400 text-[10px] font-bold uppercase flex items-center gap-1 group-hover:text-blue-300">
                                                        <AlertCircle size={10} /> Connect Wallet to view
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-blue-100/80 leading-relaxed font-medium">
                                                    {isCoaching ? "Scanning..." : coachTip}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: DESCRIPTION */}
                    <div className="lg:col-span-8 flex flex-col h-full">
                        <label htmlFor="pitch-description" className="block text-white/60 mb-3 text-[10px] font-black uppercase tracking-[0.2em] italic border-l-2 border-blue-500 pl-3">
                            The Pitch <span className="text-blue-400 ml-1">*</span>
                        </label>
                        <textarea
                            id="pitch-description"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="e.g., A Solana memecoin that taxes sells to fund carbon credits. Target: eco-conscious degens. Vibe: Pepe meets Al Gore."
                            aria-describedby={errors.description ? "pitch-error" : undefined}
                            className="w-full flex-1 p-6 bg-slate-900/60 border border-white/5 text-white placeholder-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none font-mono text-sm leading-relaxed rounded-2xl min-h-[300px]"
                        />
                        {errors.description && (
                            <p id="pitch-error" className="text-red-500 text-xs mt-2 font-mono flex items-center gap-2 animate-pulse">
                                <AlertCircle size={12} /> {errors.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* COLLAPSIBLE ADVANCED SECTION */}
            <div className="border border-white/5 rounded-[24px] overflow-hidden bg-slate-900/20 backdrop-blur-sm transition-all duration-300">
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${showAdvanced ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40 group-hover:text-white/60'}`}>
                            <Settings2 size={18} />
                        </div>
                        <div className="text-left">
                            <h3 className={`text-sm font-bold tracking-wide transition-colors ${showAdvanced ? 'text-blue-100' : 'text-white/60 group-hover:text-white'}`}>Advanced Configuration</h3>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Team, Metrics, Resources</p>
                        </div>
                    </div>
                    <div className={`transition-transform duration-300 ${showAdvanced ? 'rotate-180 text-blue-400' : 'text-white/20'}`}>
                        <ChevronDown size={20} />
                    </div>
                </button>

                {showAdvanced && (
                    <div className="p-8 pt-0 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        {/* Sub-Section: Execution */}
                        <div className="space-y-6 mt-6">
                            <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Execution Readiness</h4>

                            {/* Team Size */}
                            <div>
                                <label className="text-white/40 text-xs mb-2 block">Team Size</label>
                                <div className="flex gap-2">
                                    {['solo', 'team_2_5', 'team_6_plus'].map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => handleChange('teamSize', size)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono border transition-all ${formData.teamSize === size
                                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                                                : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
                                        >
                                            {size === 'solo' ? 'Solo' : size === 'team_2_5' ? '2-5' : '6+'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Token Address */}
                            <div>
                                <label htmlFor="token-address" className="text-white/40 text-xs mb-2 block">Token Address (Optional)</label>
                                <input
                                    id="token-address"
                                    type="text"
                                    value={formData.tokenAddress}
                                    onChange={(e) => handleChange('tokenAddress', e.target.value)}
                                    placeholder="Solana CA..."
                                    className="w-full p-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs font-mono text-white focus:border-blue-500/50 outline-none"
                                />
                            </div>

                            {/* SECTOR SPECIFIC EXTRA FIELDS */}
                            {formData.projectType === 'memecoin' && (
                                <div>
                                    <label htmlFor="community-vibe" className="text-white/40 text-xs mb-2 block">Community Vibe</label>
                                    <select
                                        id="community-vibe"
                                        value={formData.memecoinVibe || ''}
                                        onChange={(e) => handleChange('memecoinVibe', e.target.value)}
                                        className="w-full p-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs font-mono text-white focus:border-blue-500/50 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-slate-900">Select...</option>
                                        <option value="cult" className="bg-slate-900">Cult / Conviction</option>
                                        <option value="chill" className="bg-slate-900">Chill</option>
                                        <option value="raiding" className="bg-slate-900">Raiding</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Sub-Section: Strategy */}
                        <div className="space-y-6 mt-6">
                            <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Strategy & Goals</h4>

                            {/* Success Def */}
                            <div>
                                <label htmlFor="success-definition" className="text-white/40 text-xs mb-2 block">Success Definition</label>
                                <input
                                    id="success-definition"
                                    type="text"
                                    value={formData.successDefinition}
                                    onChange={(e) => handleChange('successDefinition', e.target.value)}
                                    className="w-full p-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs font-mono text-white focus:border-blue-500/50 outline-none"
                                />
                            </div>

                            {/* Response Style */}
                            <div>
                                <label className="text-white/40 text-xs mb-2 block">Report Style</label>
                                <div className="flex gap-2">
                                    {['roast', 'balanced', 'analytical'].map((style) => (
                                        <button
                                            key={style}
                                            type="button"
                                            onClick={() => handleChange('responseStyle', style)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono border transition-all uppercase ${formData.responseStyle === style
                                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                                : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ACTION BAR */}
            <div className="flex justify-end pt-6">
                <button
                    type="submit"
                    className="group relative w-full md:w-auto px-10 py-5 bg-[#0055FF] hover:bg-[#0044CC] text-white font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_20px_rgba(0,85,255,0.3)] hover:shadow-[0_0_30px_rgba(0,85,255,0.6)] hover:-translate-y-0.5 active:translate-y-0 border border-white/10 overflow-hidden rounded-2xl"
                >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                    <div className="relative flex items-center justify-center gap-4 z-10">
                        <span>Initiate Protocol</span>
                    </div>
                </button>
            </div>

        </form>
    );
}
