'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ideaSubmissionSchema, IdeaSubmission } from '@/lib/ideaSchema';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, CheckCircle2, Rocket, Target, Users, Settings2, Sparkles, Lightbulb, X } from 'lucide-react';

interface IdeaSubmissionFormProps {
    onSubmit: (data: IdeaSubmission) => void;
    isSubmitting: boolean;
    initialData?: Partial<IdeaSubmission>;
    quota?: { limit: number; remaining: number } | null;
    streamingSteps?: string[];
    isConnected?: boolean;
    onConnect?: () => void;
}

const STEPS = [
    {
        id: 'vision',
        title: 'The Vision',
        subtitle: 'What are you building?',
        icon: Rocket,
        fields: ['projectType', 'description']
    },
    {
        id: 'execution',
        title: 'Execution',
        subtitle: 'Can you build it?',
        icon: Users,
        fields: ['teamSize', 'resources', 'tokenAddress']
    },
    {
        id: 'strategy',
        title: 'Strategy',
        subtitle: 'How will you grow?',
        icon: Target,
        fields: ['mvpScope', 'goToMarketPlan', 'launchLiquidityPlan']
    },
    {
        id: 'goals',
        title: 'Goals',
        subtitle: 'Define success',
        icon: Settings2,
        fields: ['successDefinition', 'responseStyle', 'attachments', 'focusHints']
    }
];

// ... imports

// ------------------------------------------------------------------
// REASONING TERMINAL COMPONENT - Now with real streaming support
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

    // Use streaming steps if provided, otherwise fall back to animation
    useEffect(() => {
        if (streamingSteps && streamingSteps.length > 0) {
            // Real streaming mode - use actual steps from API
            setLogs(streamingSteps);
        } else {
            // Fallback animation mode (for backwards compatibility)
            const baseSteps = [
                "Initializing PrediktFi Evaluator v2.1...",
                "Secure handshake with evaluation node...",
                "Parsing submission metadata...",
            ];

            const specificSteps = projectType === 'memecoin' ? [
                "Scanning Solana chain for similar tickers...",
                "Analyzing viral coefficients...",
                "Checking liquidity lock patterns...",
                "Simulating community raid potential...",
            ] : projectType === 'defi' ? [
                "Verifying yield sustainability...",
                "Checking contract audit registries...",
                "Analyzing impermanent loss risks...",
                "Stress-testing economic model...",
            ] : [
                "Analyzing technical architecture...",
                "Evaluating moat sustainability...",
                "Cross-referencing GitHub activity...",
                "Projecting training compute costs...",
            ];

            const finalSteps = [
                "Synthesizing market signals...",
                "Generating risk matrix...",
                "Finalizing institutional report...",
            ];

            const allSteps = [...baseSteps, ...specificSteps, ...finalSteps];
            let stepIndex = 0;

            const interval = setInterval(() => {
                if (stepIndex < allSteps.length) {
                    setLogs(prev => [...prev, allSteps[stepIndex]]);
                    stepIndex++;
                }
            }, 800);

            return () => clearInterval(interval);
        }
    }, [projectType, streamingSteps]);

    // Auto-scroll to bottom
    const bottomRef = React.useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (bottomRef.current?.scrollIntoView) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <div className="w-full h-[500px] flex flex-col p-8 font-mono text-xs md:text-sm bg-black/50">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-500 font-bold tracking-widest uppercase">LIVE ANALYSIS RUNNING</span>
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
                <span>STATUS: {streamingSteps && streamingSteps.length > 0 ? 'STREAMING' : 'SIMULATED'}</span>
                <span>NET: ENCRYPTED</span>
            </div>
        </div>
    );
}

export default function IdeaSubmissionForm({ onSubmit, isSubmitting, initialData, quota, streamingSteps, isConnected, onConnect }: IdeaSubmissionFormProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Partial<IdeaSubmission>>(initialData || {
        description: '',
        projectType: undefined,
        teamSize: undefined,
        resources: [],
        successDefinition: '',
        attachments: '',
        responseStyle: undefined,
        focusHints: [],
        mvpScope: '',
        goToMarketPlan: '',
        launchLiquidityPlan: '',
        tokenAddress: '',

        // Phase 2 State
        defiSecurityMarks: [],
        memecoinLaunchPreparation: [],
        aiInfraReadiness: [],
        targetTVL: '',
        targetMarketCap: '',
        targetDAU: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [animating, setAnimating] = useState(false);

    // Stable session ID that doesn't change on re-renders
    const [coachTip, setCoachTip] = useState<string | null>(null);
    const [isCoaching, setIsCoaching] = useState(false);

    // Live Coach Logic
    useEffect(() => {
        // Only run on step 0 (Vision) and if description is long enough
        if (currentStep !== 0 || !formData.description || formData.description.length < 20) {
            setCoachTip(null);
            return;
        }

        const timer = setTimeout(async () => {
            // If not connected, we still show the "UI" but blurred/locked
            if (!isConnected) {
                setCoachTip("LOCKED"); // Special flag
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
        }, 3000); // 3s debounce

        return () => clearTimeout(timer);
    }, [formData.description, currentStep, isConnected]);

    // ----------------------------------------------------------------
    // HANDLERS
    // ----------------------------------------------------------------
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
        const currentItems = (formData[field] as string[]) || []; // Type assertion needed as partial formData values can be varying types
        const newItems = currentItems.includes(item)
            ? currentItems.filter((i) => i !== item)
            : [...currentItems, item];
        handleChange(field, newItems);
    };

    const validateStep = (stepIndex: number): boolean => {
        const step = STEPS[stepIndex];
        const newErrors: Record<string, string> = {};

        // Manual validation for required fields in the current step
        // We use the zod schema partially if possible, but simple checks are faster here for UX

        if (step.id === 'vision') {
            if (!formData.projectType) newErrors.projectType = "Please select a project type.";
            if (!formData.description || formData.description.length < 10) newErrors.description = "Description is too short.";
        }

        if (step.id === 'execution') {
            if (!formData.teamSize) newErrors.teamSize = "Please select your team size.";
            // Resources generally optional or assumed empty ok, but good to check
        }

        if (step.id === 'strategy') {
            // MVP and GTM can be optional depending on strictness, but let's encourage them
            // Assuming strictness based on schema? Schema says optional string or required?
            // Checking safeParse on full schema later tells us truth.
            // For now, let's just warn if empty but allow proceed if schema allows.
            // Looking at previous code, they were just text inputs.
        }

        if (step.id === 'goals') {
            if (!formData.successDefinition || formData.successDefinition.length < 5) {
                newErrors.successDefinition = "Success definition must be at least 5 chars.";
            }
            if (!formData.responseStyle) newErrors.responseStyle = "Choose a response style.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setAnimating(true);
            setTimeout(() => {
                setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
                setAnimating(false);
            }, 300); // Wait for exit animation
        }
    };

    const handleBack = () => {
        setAnimating(true);
        setTimeout(() => {
            setCurrentStep(prev => Math.max(prev - 1, 0));
            setAnimating(false);
        }, 300);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep(currentStep)) { // Validate last step
            try {
                const validatedData = ideaSubmissionSchema.parse(formData);
                onSubmit(validatedData);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    // Normally shouldn't happen if step validation is good, 
                    // but acts as final safety net
                    console.error("Final validation failed", error);
                    alert("Please fix errors before submitting.");
                }
            }
        }
    };

    // ----------------------------------------------------------------
    // RENDER (TERMINAL UI)
    // ----------------------------------------------------------------

    // INTERCEPT: If submitting, show Reasoning Terminal
    if (isSubmitting) {
        return (
            <div className="w-full max-w-4xl mx-auto bg-slate-900/95 border border-white/10 shadow-xl rounded-xl relative overflow-hidden font-sans animate-in fade-in duration-500">
                <ReasoningTerminal projectType={formData.projectType} streamingSteps={streamingSteps} />
            </div>
        );
    }

    const progress = ((currentStep + 1) / STEPS.length) * 100;
    const currentStepConfig = STEPS[currentStep];

    return (
        <div className="w-full max-w-4xl mx-auto bg-slate-900/95 border border-white/10 shadow-xl rounded-xl relative overflow-hidden font-sans">


            {/* Terminal Header */}
            <div className="px-8 pt-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                        {React.createElement(currentStepConfig.icon, { size: 20 })}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight leading-none mb-1">
                            {currentStepConfig.title}
                        </h2>
                        <p className="text-white/40 text-sm">
                            {currentStepConfig.subtitle}
                        </p>
                    </div>
                </div>

                {/* Segmented Progress */}
                <div className="flex gap-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    {STEPS.map((step, idx) => (
                        <div
                            key={step.id}
                            className={`h-full flex-1 transition-all duration-500 rounded-full ${idx <= currentStep ? 'bg-gradient-to-r from-blue-600 to-indigo-500' : 'bg-transparent'
                                }`}
                        />
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] uppercase text-white/30 tracking-widest font-mono">
                    <span>Vision</span>
                    <span>Execution</span>
                    <span>Strategy</span>
                    <span>Goals</span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-8 min-h-[500px] relative">
                <div className={`transition-all duration-200 ${animating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>

                    {/* STEP 1: VISION */}
                    {currentStep === 0 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                    Target Sector
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'memecoin', label: 'Memecoin', desc: 'VIRAL / HYPE' },
                                        { id: 'ai', label: 'AI', desc: 'LLM / INFRA' },
                                        { id: 'defi', label: 'DeFi', desc: 'YIELD / PROTOCOL' }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => handleChange('projectType', type.id)}
                                            className={`p-6 text-left transition-all hover:bg-white/5 relative group rounded-xl border ${formData.projectType === type.id
                                                ? 'bg-blue-500/10 border-blue-500/50 text-white shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                                : 'border-white/10 text-white/40 hover:text-white/80 hover:border-white/20 bg-white/5'
                                                }`}
                                        >
                                            {formData.projectType === type.id && (
                                                <div className="absolute top-3 right-3 text-blue-400">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            )}
                                            <div className="text-sm font-bold mb-1 tracking-wide">{type.label}</div>
                                            <div className="text-[10px] opacity-60 font-mono uppercase">{type.desc}</div>
                                        </button>
                                    ))}
                                </div>
                                {errors.projectType && (
                                    <p className="text-red-500 text-xs mt-2 font-mono flex items-center gap-2">
                                        <span className="text-red-500">:: ERROR ::</span> {errors.projectType}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                    Data Input: Abstract
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Describe your project..."
                                    className="w-full p-4 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none min-h-[150px] font-mono text-sm leading-relaxed rounded-xl"
                                />

                                {/* LIVE COACH TIP UI */}
                                {(coachTip || isCoaching) && (
                                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                        <div className={`bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex gap-3 relative overflow-hidden ${!isConnected ? 'cursor-pointer group' : ''}`}>
                                            {/* Shimmer effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -skew-x-12 animate-shimmer" />

                                            <div className="flex-shrink-0 mt-0.5">
                                                {isCoaching ? (
                                                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                                ) : (
                                                    <div className="bg-blue-500/20 p-1.5 rounded-full text-blue-400">
                                                        <Lightbulb size={16} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 relative z-10">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                                                        {isCoaching ? 'AI Advisor analyzing...' : 'Co-Founder Tip'}
                                                    </h4>
                                                    {!isCoaching && coachTip !== 'LOCKED' && (
                                                        <button
                                                            onClick={() => setCoachTip(null)}
                                                            className="text-white/20 hover:text-white transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>

                                                {coachTip === 'LOCKED' && !isConnected ? (
                                                    <div className="relative">
                                                        <p className="text-sm text-blue-100/40 leading-relaxed font-medium blur-sm select-none">
                                                            Considering the competitive landscape of your memecoin, have you thought about how to differentiate the narrative?
                                                        </p>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => onConnect?.()}
                                                                className="bg-blue-600/90 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg transform transition-transform group-hover:scale-105 flex items-center gap-2 cursor-pointer"
                                                            >
                                                                <Rocket size={12} /> Connect Wallet to Unlock
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-blue-100/90 leading-relaxed font-medium">
                                                        {isCoaching ? "Scanning your pitch for optimization opportunities..." : coachTip}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {errors.description && <p className="text-red-500 text-xs mt-2 font-mono">:: ERROR :: {errors.description}</p>}
                            </div>

                            {/* MEMECOIN SPECIFIC */}
                            {formData.projectType === 'memecoin' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                            Community Vibe
                                        </label>
                                        <select
                                            value={formData.memecoinVibe || ''}
                                            onChange={(e) => handleChange('memecoinVibe', e.target.value)}
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white focus:outline-none focus:border-blue-500 text-sm font-mono appearance-none rounded-lg"
                                        >
                                            <option value="" disabled> SELECT VIBE</option>
                                            <option value="cult">Cult / Conviction</option>
                                            <option value="chill">Chill / Low Stress</option>
                                            <option value="raiding">Aggressive / Raiding</option>
                                            <option value="utility">Utility (Hidden)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                            Narrative Vector
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.memecoinNarrative || ''}
                                            onChange={(e) => handleChange('memecoinNarrative', e.target.value)}
                                            placeholder="e.g. PolitiFi, Cats..."
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm font-mono rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* DEFI SPECIFIC */}
                            {formData.projectType === 'defi' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                            Mechanism Design
                                        </label>
                                        <select
                                            value={formData.defiMechanism || ''}
                                            onChange={(e) => handleChange('defiMechanism', e.target.value)}
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white focus:outline-none focus:border-blue-500 text-sm font-mono appearance-none rounded-lg"
                                        >
                                            <option value="" disabled> Select Mechanism</option>
                                            <option value="staking">Staking / Yield</option>
                                            <option value="lending">Lending / Borrowing</option>
                                            <option value="amm">DEX / AMM</option>
                                            <option value="derivatives">Perps / Options</option>
                                            <option value="aggregator">Aggregator</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                            Revenue Model
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.defiRevenue || ''}
                                            onChange={(e) => handleChange('defiRevenue', e.target.value)}
                                            placeholder="e.g. 0.3% Swap Fees..."
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm font-mono rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* AI SPECIFIC */}
                            {formData.projectType === 'ai' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                            Model Strategy
                                        </label>
                                        <select
                                            value={formData.aiModelType || ''}
                                            onChange={(e) => handleChange('aiModelType', e.target.value)}
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white focus:outline-none focus:border-blue-500 text-sm font-mono appearance-none rounded-lg"
                                        >
                                            <option value="" disabled> Select Strategy</option>
                                            <option value="wrapper">Wrapper API</option>
                                            <option value="finetuned">Fine-tuned Model</option>
                                            <option value="agents">Autonomous Agents</option>
                                            <option value="training">Training Infra</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                            Data Moat
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.aiDataMoat || ''}
                                            onChange={(e) => handleChange('aiDataMoat', e.target.value)}
                                            placeholder="e.g. Proprietary Dataset..."
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm font-mono rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}



                    {/* STEP 2: EXECUTION */}
                    {currentStep === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                    Team Composition
                                </label>
                                <div className="flex gap-4">
                                    {['solo', 'team_2_5', 'team_6_plus'].map((size) => (
                                        <label key={size} className={`flex-1 cursor-pointer p-4 border transition-all relative rounded-xl ${formData.teamSize === size
                                            ? 'bg-blue-500/10 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'}`}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="teamSize"
                                                    value={size}
                                                    checked={formData.teamSize === size}
                                                    onChange={() => handleChange('teamSize', size)}
                                                    className="appearance-none w-4 h-4 border border-white/30 rounded-full checked:bg-blue-500 checked:border-blue-500 text-blue-500 focus:ring-0 transition-all"
                                                />
                                                <span className="text-xs font-bold uppercase tracking-wider">
                                                    {size === 'solo' ? 'Solo' : size === 'team_2_5' ? '2-5 Devs' : '6+ Corp'}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {errors.teamSize && <p className="text-red-500 text-xs mt-2 font-mono">:: ERROR :: {errors.teamSize}</p>}
                            </div>

                            <div>
                                <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                    Project Assets & Readiness
                                </label>

                                {/* GENERAL RESOURCES */}
                                {!formData.projectType && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {['time', 'budget', 'skills', 'network'].map((resource) => (
                                            <button
                                                key={resource}
                                                type="button"
                                                onClick={() => toggleArrayItem('resources', resource)}
                                                className={`px-4 py-3 border transition-all flex items-center justify-between group rounded-lg ${formData.resources?.includes(resource)
                                                    ? 'bg-blue-500/10 text-blue-200 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                                    : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="uppercase text-xs font-bold tracking-wider">{resource}</span>
                                                {formData.resources?.includes(resource) && <span className="text-[10px]">Verified</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* MEMECOIN RESOURCES */}
                                {formData.projectType === 'memecoin' && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'art_ready', label: 'Art & Metadata Ready' },
                                            { id: 'kols_lined_up', label: 'KOLs & Warband Ready' },
                                            { id: 'community_manager', label: 'Community Mod' },
                                            { id: 'marketing_budget', label: 'Budget > $5k' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleArrayItem('memecoinLaunchPreparation', item.id)}
                                                className={`px-4 py-3 border transition-all flex items-center justify-between text-left rounded-none ${formData.memecoinLaunchPreparation?.includes(item.id)
                                                    ? 'bg-blue-500/10 text-blue-200 border-blue-500/50'
                                                    : 'bg-black text-white/40 border-white/20 hover:border-white/40'
                                                    }`}
                                            >
                                                <span className="text-xs font-bold tracking-wider">{item.label}</span>
                                                {formData.memecoinLaunchPreparation?.includes(item.id) ? (
                                                    <span className="text-[10px] bg-blue-500/20 px-1">Confirmed</span>
                                                ) : <span className="text-[10px] opacity-20">Unverified</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* DEFI RESOURCES */}
                                {formData.projectType === 'defi' && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'audit_planned', label: 'Security Audit' },
                                            { id: 'multisig_setup', label: 'Multisig / DAO' },
                                            { id: 'timelock', label: 'Timelock Contracts' },
                                            { id: 'testnet_live', label: 'Testnet Deployed' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleArrayItem('defiSecurityMarks', item.id)}
                                                className={`px-4 py-3 border transition-all flex items-center justify-between text-left rounded-none ${formData.defiSecurityMarks?.includes(item.id)
                                                    ? 'bg-blue-500/10 text-blue-200 border-blue-500/50'
                                                    : 'bg-black text-white/40 border-white/20 hover:border-white/40'
                                                    }`}
                                            >
                                                <span className="text-xs font-bold tracking-wider">{item.label}</span>
                                                {formData.defiSecurityMarks?.includes(item.id) ? (
                                                    <span className="text-[10px] bg-blue-500/20 px-1">Secured</span>
                                                ) : <span className="text-[10px] opacity-20">Missing</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* AI RESOURCES */}
                                {formData.projectType === 'ai' && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'gpu_access', label: 'GPU Compute' },
                                            { id: 'proprietary_data', label: 'Clean Dataset' },
                                            { id: 'ml_engineer', label: 'ML Engineer Lead' },
                                            { id: 'prototype_working', label: 'Prototype Online' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleArrayItem('aiInfraReadiness', item.id)}
                                                className={`px-4 py-3 border transition-all flex items-center justify-between text-left rounded-none ${formData.aiInfraReadiness?.includes(item.id)
                                                    ? 'bg-blue-500/10 text-blue-200 border-blue-500/50'
                                                    : 'bg-black text-white/40 border-white/20 hover:border-white/40'
                                                    }`}
                                            >
                                                <span className="text-xs font-bold tracking-wider">{item.label}</span>
                                                {formData.aiInfraReadiness?.includes(item.id) ? (
                                                    <span className="text-[10px] bg-blue-500/20 px-1">Ready</span>
                                                ) : <span className="text-[10px] opacity-20">Not Ready</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {(formData.projectType === 'memecoin' || formData.projectType === 'defi') && (
                                <div>
                                    <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                        Existing Token Contract
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tokenAddress || ''}
                                        onChange={(e) => handleChange('tokenAddress', e.target.value)}
                                        placeholder="Solana CA (7xW...)"
                                        className="w-full p-4 bg-black border border-white/20 text-white placeholder-white/20 focus:outline-none focus:border-green-500 text-sm font-mono"
                                    />
                                    <p className="text-[10px] text-green-500/60 mt-2 font-mono">
                                        For live tokens only. We'll scan for rug pull risks and liquidity locks.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}


                    {/* STEP 3: STRATEGY */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                    MVP Scope (6-12m)
                                </label>
                                <textarea
                                    value={formData.mvpScope}
                                    onChange={(e) => handleChange('mvpScope', e.target.value)}
                                    placeholder="Define deliverables..."
                                    className="w-full p-4 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-green-500 resize-none min-h-[120px] font-mono text-sm rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                    Distribution Vector
                                </label>
                                <textarea
                                    value={formData.goToMarketPlan}
                                    onChange={(e) => handleChange('goToMarketPlan', e.target.value)}
                                    placeholder="Define target users..."
                                    className="w-full p-4 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-green-500 resize-none min-h-[120px] font-mono text-sm rounded-xl"
                                />
                            </div>

                            {(formData.projectType === 'memecoin' || formData.projectType === 'defi') && (
                                <div>
                                    <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                        Liquidity Plan
                                    </label>
                                    <textarea
                                        value={formData.launchLiquidityPlan}
                                        onChange={(e) => handleChange('launchLiquidityPlan', e.target.value)}
                                        placeholder="Define liquidity setup..."
                                        className="w-full p-4 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-green-500 resize-none min-h-[120px] font-mono text-sm rounded-xl"
                                    />
                                </div>
                            )}
                        </div>
                    )}


                    {/* STEP 4: GOALS */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                    Success Metric
                                </label>

                                {formData.projectType === 'memecoin' ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <input
                                                type="text"
                                                value={formData.targetMarketCap || ''}
                                                onChange={(e) => {
                                                    handleChange('targetMarketCap', e.target.value);
                                                    handleChange('successDefinition', `Target MC: ${e.target.value}`);
                                                }}
                                                placeholder="Target Market Cap (e.g. $10M)"
                                                className="w-full p-4 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm font-mono rounded-lg"
                                            />
                                        </div>
                                    </div>
                                ) : formData.projectType === 'defi' ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <input
                                                type="text"
                                                value={formData.targetTVL || ''}
                                                onChange={(e) => {
                                                    handleChange('targetTVL', e.target.value);
                                                    handleChange('successDefinition', `Target TVL: ${e.target.value}`);
                                                }}
                                                placeholder="Target TVL (e.g. $1M)"
                                                className="w-full p-4 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm font-mono rounded-lg"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={formData.successDefinition}
                                        onChange={(e) => handleChange('successDefinition', e.target.value)}
                                        placeholder="Define success..."
                                        className="w-full p-4 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-green-500 text-sm font-mono rounded-lg"
                                    />
                                )}
                                {errors.successDefinition && <p className="text-red-500 text-xs mt-2 font-mono">:: ERROR :: {errors.successDefinition}</p>}
                            </div>

                            <div>
                                <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                    Output Format
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'short', label: 'Short Verdict', desc: 'Direct & Brutal' },
                                        { id: 'full', label: 'Full Report', desc: 'Deep Analysis' },
                                        { id: 'next_steps', label: 'Action Plan', desc: 'Task List' },
                                    ].map((style) => (
                                        <button
                                            key={style.id}
                                            type="button"
                                            onClick={() => handleChange('responseStyle', style.id)}
                                            className={`p-4 text-left transition-all hover:bg-white/5 relative border rounded-xl ${formData.responseStyle === style.id
                                                ? 'bg-blue-500/10 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/80 hover:border-white/20'
                                                }`}
                                        >
                                            {formData.responseStyle === style.id && <span className="absolute top-3 right-3 text-blue-500 text-[10px] bg-blue-500/10 px-2 py-0.5 rounded-full">Active</span>}
                                            <div className="font-bold mb-1 text-sm tracking-wide">{style.label}</div>
                                            <div className="text-[10px] opacity-60 font-mono uppercase">{style.desc}</div>
                                        </button>
                                    ))}
                                </div>
                                {errors.responseStyle && <p className="text-red-500 text-xs mt-2 font-mono">:: ERROR :: {errors.responseStyle}</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Terminal Footer */}
            <div className="px-8 py-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div>
                    {currentStep > 0 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold"
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                    )}
                </div>

                <div>
                    {currentStep < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-2 bg-white text-black px-6 py-3 text-sm font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors rounded-full"
                        >
                            Next Step <ArrowRight size={14} />
                        </button>
                    ) : (
                        <div className="flex items-center gap-4">
                            {quota && (
                                <div className={`text-[10px] font-mono border px-3 py-1.5 rounded-full ${quota.remaining === 0
                                    ? 'border-red-500 text-red-500 bg-red-500/10'
                                    : 'border-green-500 text-green-500 bg-green-500/10'
                                    }`}>
                                    Quota: {quota.remaining}/{quota.limit}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || (quota?.remaining === 0)}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:grayscale rounded-full"
                            >
                                {isSubmitting ? 'Processing...' : 'Analyze Idea'} <Sparkles size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}



