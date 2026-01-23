'use client';

import React, { useState, useEffect } from 'react';
import { ideaSubmissionSchema, IdeaSubmission } from '@/lib/ideaSchema';
import { z } from 'zod';
import { Rocket, Target, Users, Settings2, Lightbulb, X, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';

interface IdeaSubmissionFormProps {
    onSubmit: (data: IdeaSubmission) => void;
    isSubmitting: boolean;
    initialData?: Partial<IdeaSubmission>;
    quota?: { limit: number; remaining: number } | null;
    streamingSteps?: string[];
    isConnected?: boolean;
    onConnect?: () => void;
}

// ------------------------------------------------------------------
// REASONING TERMINAL COMPONENT
// ------------------------------------------------------------------
function ReasoningTerminal({ projectType, streamingSteps }: { projectType?: string; streamingSteps?: string[] }) {
    const [logs, setLogs] = useState<string[]>([]);
    const [startTime] = useState(() => Date.now());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Update elapsed time
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    // Streaming Logic
    useEffect(() => {
        if (streamingSteps && streamingSteps.length > 0) {
            setLogs(streamingSteps);
        } else {
            // Fallback honest animation if stream is delayed
            // Just show initializing to prevent empty screen
            setLogs(["Initializing PrediktFi Evaluator..."]);
        }
    }, [projectType, streamingSteps]);

    // Auto-scroll
    const bottomRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (bottomRef.current?.scrollIntoView) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <div className="w-full h-[500px] flex flex-col p-8 font-mono text-xs md:text-sm bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <span className="text-blue-400 font-bold tracking-[0.2em] uppercase italic">LIVE ANALYSIS RUNNING</span>
                </div>
                <div className="text-white/40 font-mono text-xs">
                    {elapsedSeconds}s elapsed
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/20">
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 text-white/70 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-white/20 select-none">
                            {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-white">
                            {'>'} {log}
                        </span>
                    </div>
                ))}

                <div className="flex gap-3 text-blue-400 animate-pulse">
                    <span className="text-white/20 select-none">
                        {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span>_</span>
                </div>
                <div ref={bottomRef} />
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-white/30 text-[10px] uppercase tracking-widest">
                <span>STEPS: {logs.length}</span>
                <span>STATUS: {streamingSteps && streamingSteps.length > 0 ? 'STREAMING' : 'CONNECTING...'}</span>
                <span>NET: ENCRYPTED</span>
            </div>
        </div>
    );
}

export default function IdeaSubmissionForm({ onSubmit, isSubmitting, initialData, quota, streamingSteps, isConnected, onConnect }: IdeaSubmissionFormProps) {
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
    if (isSubmitting) {
        return (
            <div className="w-full max-w-4xl mx-auto bg-slate-900/95 border border-white/10 shadow-xl rounded-xl relative overflow-hidden font-sans animate-in fade-in duration-500">
                <ReasoningTerminal projectType={formData.projectType} streamingSteps={streamingSteps} />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* MAIN CARD */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-2xl rounded-[32px] overflow-hidden p-8 relative">

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
                            <div className="space-y-3">
                                {[
                                    { id: 'memecoin', label: 'Memecoin', desc: 'Viral / Hype' },
                                    { id: 'ai', label: 'AI Agent', desc: 'LLM / Infra' },
                                    { id: 'defi', label: 'DeFi', desc: 'Yield / Tech' }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => handleChange('projectType', type.id)}
                                        className={`w-full p-4 text-left transition-all relative group rounded-xl border ${formData.projectType === type.id
                                            ? 'bg-blue-500/10 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                                            : 'border-white/10 text-white/40 hover:text-white/80 hover:border-white/20 bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="block text-sm font-bold tracking-wide">{type.label}</span>
                                                <span className="block text-[10px] uppercase opacity-50 mt-1 tracking-wider">{type.desc}</span>
                                            </div>
                                            {formData.projectType === type.id && <CheckCircle2 size={16} className="text-blue-400" />}
                                        </div>
                                    </button>
                                ))}
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
                        <label className="block text-white/60 mb-3 text-[10px] font-black uppercase tracking-[0.2em] italic border-l-2 border-blue-500 pl-3">
                            The Pitch <span className="text-blue-400 ml-1">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="e.g., A Solana memecoin that taxes sells to fund carbon credits. Target: eco-conscious degens. Vibe: Pepe meets Al Gore."
                            className="w-full flex-1 p-6 bg-slate-900/60 border border-white/5 text-white placeholder-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none font-mono text-sm leading-relaxed rounded-2xl min-h-[300px]"
                        />
                        {errors.description && (
                            <p className="text-red-500 text-xs mt-2 font-mono flex items-center gap-2 animate-pulse">
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
                                <label className="text-white/40 text-xs mb-2 block">Token Address (Optional)</label>
                                <input
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
                                    <label className="text-white/40 text-xs mb-2 block">Community Vibe</label>
                                    <select
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
                                <label className="text-white/40 text-xs mb-2 block">Success Definition</label>
                                <input
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
                                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
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
            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="relative flex items-center gap-3">
                        <Rocket size={20} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                        <span>RUN ANALYSIS</span>
                    </div>
                </button>
            </div>

        </form>
    );
}
