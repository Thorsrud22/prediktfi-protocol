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
    CircleAlert as AlertCircle,
    Activity,
    Terminal
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '../components/ToastProvider';

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
    isQuotaLoading?: boolean;
    resetCountdown?: string;
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
        { words: ['[BEAR]'], className: 'text-red-500 font-bold tracking-wider' },
        { words: ['[BULL]'], className: 'text-green-400 font-bold tracking-wider' },
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

    const [showTechnicalLogs, setShowTechnicalLogs] = useState(false);

    // Get current activity for simple view
    const currentActivity = React.useMemo(() => {
        const lastStep = logs.filter(l => l.type === 'step').pop();
        return lastStep ? lastStep.text : "Initializing PrediktFi Protocol...";
    }, [logs]);

    return (
        <div className="w-full h-[500px] flex flex-col font-mono text-xs md:text-sm bg-slate-950 backdrop-blur-md rounded-xl border border-white/10 relative overflow-hidden shadow-2xl transition-all duration-500">
            {/* CRT Scanline Overlay - Always visible for vibe */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)',
            }} />

            {/* MacOS-style Title Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-white/5 relative z-20">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
                    <span className="text-white/60 text-xs font-medium tracking-wide">prediktfi — evaluation</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="text-emerald-400/80">{displayProgress.toFixed(0)}%</span>
                    <span className={`transition-colors duration-500 ${elapsedSeconds > 20 ? "text-blue-400 animate-pulse font-bold" : "text-white/30"}`}>
                        {elapsedSeconds > 20 ? "DEEP REASONING" : `T+${formatElapsed(elapsedSeconds)}`}
                    </span>
                </div>
            </div>

            {/* Progress Bar - Always at top */}
            <div className="h-1 bg-slate-800 relative overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                    style={{ width: `${displayProgress}%` }}
                />
            </div>

            <div className="flex-1 relative z-20 overflow-hidden flex flex-col">

                {!showTechnicalLogs ? (
                    /* === SIMPLE VIEW === */
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                        {/* Central Pulse */}
                        <div className="relative mb-8">
                            <div className="w-24 h-24 rounded-full border border-cyan-500/20 flex items-center justify-center relative">
                                <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-[ping_3s_linear_infinite]" />
                                <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-[ping_2s_linear_infinite_reverse]" />
                                <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center backdrop-blur-sm">
                                    <Activity size={32} className="text-cyan-400 animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* Current Activity */}
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">
                            {error ? "Analysis Halted" : currentActivity}
                        </h3>

                        <p className="text-white/40 text-sm max-w-lg mx-auto mb-8 min-h-[1.5rem]">
                            {streamingThoughts ? (
                                <span className="animate-pulse italic text-cyan-500/60">
                                    {(streamingThoughts.split('\n').filter(t => t.trim()).pop() || 'Reasoning...').replace(/^["']|["']$/g, '')}
                                </span>
                            ) : (
                                <span className="text-white/20">Processing data...</span>
                            )}
                        </p>

                        <button
                            onClick={() => setShowTechnicalLogs(true)}
                            className="flex items-center gap-2 text-xs text-white/30 hover:text-white transition-colors uppercase tracking-widest bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/5"
                        >
                            <Terminal size={12} /> Show Technical Logs
                        </button>
                    </div>
                ) : (
                    /* === TECHNICAL TERMINAL VIEW === */
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex-1 overflow-y-auto space-y-1 p-5 pr-2 scrollbar-thin scrollbar-thumb-cyan-500/20">
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

                        {/* Footer Status Bar with Hide Toggle */}
                        <div className="pt-3 border-t border-cyan-500/10 flex justify-between items-center text-[9px] uppercase tracking-[0.15em] px-4 pb-2 bg-slate-900/50">
                            <div className="flex gap-4">
                                <span className="text-cyan-500/40">LOGS: <span className="text-cyan-400">{logs.length}</span></span>
                                <span className="text-cyan-500/40 hidden sm:inline">
                                    STATUS: <span className={streamingSteps && streamingSteps.length > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                                        {streamingSteps && streamingSteps.length > 0 ? 'STREAMING' : error ? 'FAILURE' : 'CONNECTING...'}
                                    </span>
                                </span>
                                <span className="text-cyan-500/40 hidden sm:inline">NET: <span className={error ? "text-red-500" : "text-emerald-400"}>{error ? "OFFLINE" : "ENCRYPTED"}</span></span>
                            </div>

                            <button
                                onClick={() => setShowTechnicalLogs(false)}
                                className="text-white/30 hover:text-white transition-colors flex items-center gap-1"
                            >
                                Hide Logs <ChevronDown size={10} />
                            </button>
                        </div>
                    </div>
                )}
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


export default function IdeaSubmissionForm({ onSubmit, isSubmitting, initialData, quota, streamingSteps, streamingThoughts, isConnected, onConnect, error, isQuotaLoading, resetCountdown }: IdeaSubmissionFormProps) {
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

    // Sync form state with initialData when it changes (for "Refine Input" flow)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showAdvanced, setShowAdvanced] = useState(false);
    const { addToast } = useToast();

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

    // Validate Solana address format (base58, 32-44 chars)
    const isValidSolanaAddress = (addr: string): boolean => {
        if (!addr) return true; // Empty is OK
        if (addr.length < 32 || addr.length > 44) return false;
        // Base58 character set (no 0, O, I, l)
        return /^[1-9A-HJ-NP-Za-km-z]+$/.test(addr);
    };

    // Handlers
    const handleChange = (field: keyof IdeaSubmission, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Real-time validation for tokenAddress
        if (field === 'tokenAddress') {
            if (value && !isValidSolanaAddress(value)) {
                setErrors((prev) => ({ ...prev, tokenAddress: 'Invalid Solana address format (must be 32-44 base58 characters)' }));
            } else if (errors.tokenAddress) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.tokenAddress;
                    return newErrors;
                });
            }
        } else if (errors[field]) {
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
            // Auto-scroll to error
            const element = document.getElementById('pitch-description');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
            }
            return;
        }

        if (!formData.projectType) {
            setErrors({ projectType: "Please select a project sector." });
            return;
        }

        // Validate token address if provided
        if (formData.tokenAddress && !isValidSolanaAddress(formData.tokenAddress)) {
            setErrors({ tokenAddress: "Invalid Solana address format (must be 32-44 base58 characters)" });
            return;
        }

        // Use Zod for final cleanup/defaults
        try {
            const validatedData = ideaSubmissionSchema.parse(formData);
            onSubmit(validatedData);
        } catch (error) {
            if (error instanceof z.ZodError) {
                console.error("Submission Schema Error", error);
                // Extract the first error message to show to user
                const firstError = error.errors[0];
                if (firstError?.path[0]) {
                    setErrors({ [firstError.path[0] as string]: firstError.message });
                }
                // Don't submit if Zod validation fails
            }
        }
    };

    // Save Draft Function
    const handleSaveDraft = () => {
        // In a real app, you might save to localStorage or a specific draft endpoint
        // For now, these inputs are preserved in state, but we'll simulate a save action logic
        // to give user peace of mind.
        try {
            localStorage.setItem('prediktfi_draft', JSON.stringify(formData));
            addToast({ title: 'Draft saved safely to browser', variant: 'success' });
        } catch (e) {
            console.error('Failed to save draft', e);
            addToast({ title: 'Could not save draft locally', variant: 'error' });
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

                        {/* TEAM SIZE - MOVED HERE */}
                        <div>
                            <label className="block text-white/60 mb-3 text-[10px] font-black uppercase tracking-[0.2em] italic border-l-2 border-blue-500 pl-3">
                                Team Size <span className="text-blue-400 ml-1">*</span>
                            </label>
                            <div className="flex gap-2">
                                {['solo', 'team_2_5', 'team_6_plus'].map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => handleChange('teamSize', size)}
                                        className={`flex-1 py-3 px-3 rounded-xl text-xs font-mono border transition-all ${formData.teamSize === size
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                            : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
                                    >
                                        {size === 'solo' ? 'Solo' : size === 'team_2_5' ? '2-5' : '6+'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* SUCCESS DEFINITION - MOVED HERE */}
                        <div>
                            <label htmlFor="success-definition" className="block text-white/60 mb-3 text-[10px] font-black uppercase tracking-[0.2em] italic border-l-2 border-blue-500 pl-3">
                                Success Definition
                            </label>
                            <input
                                id="success-definition"
                                type="text"
                                value={formData.successDefinition}
                                onChange={(e) => handleChange('successDefinition', e.target.value)}
                                placeholder="e.g. 10k users, $1M TVL, or just learning"
                                className="w-full p-4 bg-slate-900/60 border border-white/5 rounded-xl text-sm font-mono text-white placeholder-white/20 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                            />
                        </div>
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
                            aria-invalid={errors.description ? "true" : undefined}
                            className={`w-full flex-1 p-6 bg-slate-900/60 border text-white placeholder-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none font-mono text-sm leading-relaxed rounded-2xl min-h-[300px] ${errors.description ? 'border-red-500 ring-1 ring-red-500/50 bg-red-500/5' : 'border-white/5'}`}
                        />
                        {errors.description && (
                            <p id="pitch-error" role="alert" className="text-red-500 text-xs mt-2 font-mono flex items-center gap-2 animate-pulse">
                                <AlertCircle size={12} /> {errors.description}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* SOLANA TOKEN ADDRESS - NOW PROMINENT */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl rounded-[24px] p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <label htmlFor="token-address" className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] italic border-l-2 border-blue-500 pl-3">
                            Solana Token Address <span className="text-white/20 font-normal normal-case tracking-normal ml-1">(Optional)</span>
                        </label>
                        {formData.tokenAddress && isValidSolanaAddress(formData.tokenAddress || '') && (
                            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full">
                                <CheckCircle2 size={10} /> Valid Address
                            </span>
                        )}
                    </div>

                    <div className="relative">
                        <input
                            id="token-address"
                            type="text"
                            value={formData.tokenAddress}
                            onChange={(e) => handleChange('tokenAddress', e.target.value)}
                            placeholder="e.g. EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                            aria-describedby={errors.tokenAddress ? "token-address-error" : undefined}
                            aria-invalid={errors.tokenAddress ? "true" : undefined}
                            className={`w-full p-4 bg-slate-900/60 border rounded-xl text-sm font-mono text-white placeholder-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all ${errors.tokenAddress ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 group-hover:border-white/10'
                                }`}
                        />
                        {/* Optional decorative icon inside input */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 pointer-events-none">
                            <Target size={16} />
                        </div>
                    </div>

                    {errors.tokenAddress && (
                        <p id="token-address-error" role="alert" className="text-red-500 text-xs mt-2 font-mono flex items-center gap-2 animate-pulse">
                            <AlertCircle size={12} /> {errors.tokenAddress}
                        </p>
                    )}

                    <p className="text-[10px] text-white/30 mt-3 leading-relaxed max-w-2xl">
                        <span className="text-blue-400 font-bold">Recommended:</span> Provide a contract address to enable <strong>On-Chain Verification</strong> (Liquidity, Mint Authority, Holders). Without this, you will receive a <em>Simulated Report</em> only.
                    </p>
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
                            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">Team, Token, Strategy</p>
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

                            {/* Team Size: Moved to Main Left Column */}
                            {/* <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-xs text-white/30">Team Size moved to main view.</span>
                            </div> */}

                            {/* Token Address: Moved to main form above for better visibility */}

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
                            {/* Success Def: Moved to Main Left Column */}

                            {/* Response Style */}
                            <div>
                                <label className="text-white/40 text-xs mb-2 block">Report Style</label>
                                <div className="space-y-3">
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

                                    {/* Style Description */}
                                    <p className="text-[10px] text-white/40 italic pl-1 border-l-2 border-white/5 animate-in fade-in duration-300">
                                        {formData.responseStyle === 'roast' && "Ruthless critique focused on flaws and hard truths. High entertainment, strict scoring."}
                                        {formData.responseStyle === 'balanced' && "Fair, objective evaluation with constructive feedback. Standard depth and scoring."}
                                        {formData.responseStyle === 'analytical' && "Rigorous technical deep-dive. Data-driven, strictly professional, and highly critical."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ACTION BAR */}
            <div className="flex flex-col items-end gap-4 pt-6">
                {/* Quota Exceeded Warning - SOFTENED */}
                {quota?.remaining === 0 && (
                    <div className="w-full md:w-auto bg-slate-800/80 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-3 animate-in fade-in duration-300">
                        <div className="p-2 bg-blue-500/10 rounded-full text-blue-400">
                            <Lightbulb size={16} />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm mb-1">Daily Limit Reached</p>
                            <p className="text-white/60 text-xs leading-relaxed max-w-sm">
                                You've hit the free tier limit for today.
                                <br />
                                You can <strong>save your draft</strong> and continue tomorrow, or upgrade for instant access.
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Button Logic */}
                {isQuotaLoading ? (
                    <button
                        type="button"
                        disabled
                        className="group relative w-full md:w-auto px-10 py-5 font-black text-xs uppercase tracking-[0.2em] border border-white/5 overflow-hidden rounded-2xl bg-slate-800/50 text-white/20 cursor-wait"
                    >
                        <div className="relative flex items-center justify-center gap-4 z-10 animate-pulse">
                            <span>Checking Status...</span>
                        </div>
                    </button>
                ) : quota?.remaining === 0 ? (
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={handleSaveDraft}
                            className="group relative w-full md:w-auto px-8 py-4 font-bold text-xs uppercase tracking-widest border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <span>Save Draft</span>
                        </button>

                        <Link
                            href="/pricing"
                            className="group relative w-full md:w-auto px-8 py-4 font-bold text-xs uppercase tracking-widest border border-blue-500/30 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 hover:text-blue-100 transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
                        >
                            <span>Get Unlimited</span> <Rocket size={14} />
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                        <button
                            type="submit"
                            disabled={!!errors.tokenAddress}
                            className={`group relative w-full md:w-auto px-10 py-5 font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border border-white/10 overflow-hidden rounded-2xl ${errors.tokenAddress
                                ? 'bg-slate-700 text-white/40 cursor-not-allowed'
                                : 'bg-[#0055FF] hover:bg-[#0044CC] text-white shadow-[0_0_20px_rgba(0,85,255,0.3)] hover:shadow-[0_0_30px_rgba(0,85,255,0.6)] hover:-translate-y-0.5 active:translate-y-0'
                                }`}
                        >
                            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                            <div className="relative flex items-center justify-center gap-4 z-10">
                                <span>{errors.tokenAddress ? 'Invalid Address' : 'Initiate Protocol'}</span>
                            </div>
                        </button>
                        <div className="mt-3 text-center">
                            <span className="text-[10px] text-white/40 font-mono tracking-wide">
                                Estimated time: ~2 minutes
                            </span>
                        </div>
                        {!isConnected && (
                            <button
                                type="button"
                                onClick={() => onConnect?.()}
                                className="text-[10px] text-white/30 hover:text-blue-400 transition-colors uppercase tracking-widest flex items-center gap-1"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-pulse" />
                                Connect wallet to save history
                            </button>
                        )}
                    </div>
                )}
            </div>

        </form>
    );
}
