'use client';

import React, { useState, useMemo } from 'react';
import { ideaSubmissionSchema, IdeaSubmission } from '@/lib/ideaSchema';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, CheckCircle2, Rocket, Target, Users, Settings2, Sparkles } from 'lucide-react';

interface IdeaSubmissionFormProps {
    onSubmit: (data: IdeaSubmission) => void;
    isSubmitting: boolean;
    initialData?: Partial<IdeaSubmission>;
    quota?: { limit: number; remaining: number } | null;
}

// ------------------------------------------------------------------
// STEP DEFINITIONS
// ------------------------------------------------------------------
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

export default function IdeaSubmissionForm({ onSubmit, isSubmitting, initialData, quota }: IdeaSubmissionFormProps) {
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
            if (!formData.successDefinition) newErrors.successDefinition = "Please define success.";
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

    // progress percentage
    const progress = ((currentStep + 1) / STEPS.length) * 100;
    const currentStepConfig = STEPS[currentStep];

    return (
        <div className="w-full max-w-3xl mx-auto bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
            {/* Progress Bar */}
            <div className="h-1 bg-slate-800 w-full">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <div className="px-8 pt-8 pb-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            {React.createElement(currentStepConfig.icon, { size: 24 })}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{currentStepConfig.title}</h2>
                            <p className="text-slate-400 text-sm">{currentStepConfig.subtitle}</p>
                        </div>
                    </div>
                    <span className="text-slate-500 text-sm font-medium tracking-wide">
                        STEP {currentStep + 1} OF {STEPS.length}
                    </span>
                </div>
            </div>

            {/* Form Content - Animated Config */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
                <div className={`transition-all duration-300 ease-in-out ${animating ? 'opacity-0 translate-x-4 scale-95' : 'opacity-100 translate-x-0 scale-100'}`}>

                    {/* STEP 1: VISION */}
                    {currentStep === 0 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div>
                                <label className="block text-blue-200 mb-3 font-medium">Project Type</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { id: 'memecoin', label: 'Memecoin', desc: 'Viral & Community' },
                                        { id: 'defi', label: 'DeFi', desc: 'Financial Protocol' },
                                        { id: 'ai', label: 'AI Agent', desc: 'Autonomous / LLM' }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => handleChange('projectType', type.id)}
                                            className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${formData.projectType === type.id
                                                ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/40 transform scale-[1.02]'
                                                : 'bg-slate-800/40 border-white/10 hover:bg-slate-800 hover:border-white/20'
                                                }`}
                                        >
                                            <div className={`text-lg font-semibold mb-1 ${formData.projectType === type.id ? 'text-white' : 'text-slate-200'}`}>
                                                {type.label}
                                            </div>
                                            <div className={`text-xs ${formData.projectType === type.id ? 'text-blue-200' : 'text-slate-500'}`}>
                                                {type.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {errors.projectType && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><Sparkles size={14} /> {errors.projectType}</p>}
                            </div>

                            <div>
                                <label className="block text-blue-200 mb-2 font-medium">Short Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Describe your project in a few sentences... What problem does it solve?"
                                    className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none min-h-[120px]"
                                />
                                {errors.description && <p className="text-red-400 text-sm mt-2">{errors.description}</p>}
                            </div>

                            {/* --- SMART CONDITIONAL FIELDS --- */}

                            {/* MEMECOIN SPECIFIC */}
                            {formData.projectType === 'memecoin' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                    <div>
                                        <label className="block text-blue-200 mb-2 font-medium">Community Vibe</label>
                                        <select
                                            value={formData.memecoinVibe || ''}
                                            onChange={(e) => handleChange('memecoinVibe', e.target.value)}
                                            className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                                        >
                                            <option value="" disabled>Select Vibe</option>
                                            <option value="cult">Cult / High Conviction</option>
                                            <option value="chill">Chill / Low Stress</option>
                                            <option value="raiding">Aggressive / Raiding</option>
                                            <option value="utility">Utility Hidden as Meme</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-blue-200 mb-2 font-medium">Meme Narrative</label>
                                        <input
                                            type="text"
                                            value={formData.memecoinNarrative || ''}
                                            onChange={(e) => handleChange('memecoinNarrative', e.target.value)}
                                            placeholder="e.g. PolitiFi, Cats, Retro..."
                                            className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* DEFI SPECIFIC */}
                            {formData.projectType === 'defi' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                    <div>
                                        <label className="block text-blue-200 mb-2 font-medium">Core Mechanism</label>
                                        <select
                                            value={formData.defiMechanism || ''}
                                            onChange={(e) => handleChange('defiMechanism', e.target.value)}
                                            className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                                        >
                                            <option value="" disabled>Select Mechanism</option>
                                            <option value="staking">Staking / Yield</option>
                                            <option value="lending">Lending / Borrowing</option>
                                            <option value="amm">DEX / AMM</option>
                                            <option value="derivatives">Perps / Options</option>
                                            <option value="aggregator">Aggregator</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-blue-200 mb-2 font-medium">Revenue Model</label>
                                        <input
                                            type="text"
                                            value={formData.defiRevenue || ''}
                                            onChange={(e) => handleChange('defiRevenue', e.target.value)}
                                            placeholder="e.g. 0.3% Swap Fees, Governance Token..."
                                            className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* AI SPECIFIC */}
                            {formData.projectType === 'ai' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                    <div>
                                        <label className="block text-blue-200 mb-2 font-medium">Model Strategy</label>
                                        <select
                                            value={formData.aiModelType || ''}
                                            onChange={(e) => handleChange('aiModelType', e.target.value)}
                                            className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                        >
                                            <option value="" disabled>Select Strategy</option>
                                            <option value="wrapper">Wrapper (OpenAI/Anthropic)</option>
                                            <option value="finetuned">Fine-tuned Model</option>
                                            <option value="agents">Autonomous Agents</option>
                                            <option value="training">Training Infra</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-blue-200 mb-2 font-medium">Data Moat</label>
                                        <input
                                            type="text"
                                            value={formData.aiDataMoat || ''}
                                            onChange={(e) => handleChange('aiDataMoat', e.target.value)}
                                            placeholder="e.g. Proprietary user data, Public scraping..."
                                            className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    {/* STEP 2: EXECUTION */}
                    {currentStep === 1 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div>
                                <label className="block text-blue-200 mb-3 font-medium">Team Size</label>
                                <div className="flex gap-4">
                                    {['solo', 'team_2_5', 'team_6_plus'].map((size) => (
                                        <label key={size} className={`flex-1 cursor-pointer p-4 rounded-xl border transition-all ${formData.teamSize === size
                                            ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-slate-950/30 border-white/10 hover:bg-slate-900'}`}>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="teamSize"
                                                    value={size}
                                                    checked={formData.teamSize === size}
                                                    onChange={() => handleChange('teamSize', size)}
                                                    className="w-5 h-5 text-blue-500 border-slate-600 bg-slate-900 focus:ring-offset-0 focus:ring-blue-500"
                                                />
                                                <span className="text-slate-200 font-medium">
                                                    {size === 'solo' ? 'Solo Builder' : size === 'team_2_5' ? '2-5 Members' : '6+ Members'}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                {errors.teamSize && <p className="text-red-400 text-sm mt-2">{errors.teamSize}</p>}
                            </div>

                            <div>
                                <label className="block text-blue-200 mb-3 font-medium">Available Resources / Readiness</label>

                                {/* ADAPTIVE CHECKLISTS */}

                                {/* DEFAULT (Others) */}
                                {!formData.projectType && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {['time', 'budget', 'skills', 'network'].map((resource) => (
                                            <button
                                                key={resource}
                                                type="button"
                                                onClick={() => toggleArrayItem('resources', resource)}
                                                className={`px-4 py-3 rounded-xl border transition-all flex items-center justify-between group ${formData.resources?.includes(resource)
                                                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                                                    : 'bg-slate-950/30 text-slate-400 border-white/10 hover:bg-slate-900'
                                                    }`}
                                            >
                                                <span className="capitalize">{resource}</span>
                                                {formData.resources?.includes(resource) && <CheckCircle2 size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* MEMECOIN RESOURCES */}
                                {formData.projectType === 'memecoin' && (
                                    <div className="grid grid-cols-1 gap-3 animate-in fade-in">
                                        {[
                                            { id: 'art_ready', label: 'Art / Metagraphics Ready' },
                                            { id: 'kols_lined_up', label: 'KOLs / Influencers Lined Up' },
                                            { id: 'community_manager', label: 'Community Manager' },
                                            { id: 'marketing_budget', label: 'Marketing Budget (> $5k)' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleArrayItem('memecoinLaunchPreparation', item.id)}
                                                className={`px-4 py-3 rounded-xl border transition-all flex items-center justify-between group text-left ${formData.memecoinLaunchPreparation?.includes(item.id)
                                                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                                                    : 'bg-slate-950/30 text-slate-400 border-white/10 hover:bg-slate-900'
                                                    }`}
                                            >
                                                <span>{item.label}</span>
                                                {formData.memecoinLaunchPreparation?.includes(item.id) && <CheckCircle2 size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* DEFI RESOURCES */}
                                {formData.projectType === 'defi' && (
                                    <div className="grid grid-cols-1 gap-3 animate-in fade-in">
                                        {[
                                            { id: 'audit_planned', label: 'Audit Planned / Completed' },
                                            { id: 'multisig_setup', label: 'Multisig / DAO Setup' },
                                            { id: 'timelock', label: 'Timelock Contracts' },
                                            { id: 'testnet_live', label: 'Testnet Live' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleArrayItem('defiSecurityMarks', item.id)}
                                                className={`px-4 py-3 rounded-xl border transition-all flex items-center justify-between group text-left ${formData.defiSecurityMarks?.includes(item.id)
                                                    ? 'bg-green-500/20 text-green-300 border-green-500/50'
                                                    : 'bg-slate-950/30 text-slate-400 border-white/10 hover:bg-slate-900'
                                                    }`}
                                            >
                                                <span>{item.label}</span>
                                                {formData.defiSecurityMarks?.includes(item.id) && <CheckCircle2 size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* AI RESOURCES */}
                                {formData.projectType === 'ai' && (
                                    <div className="grid grid-cols-1 gap-3 animate-in fade-in">
                                        {[
                                            { id: 'gpu_access', label: 'GPU Access / Credits' },
                                            { id: 'proprietary_data', label: 'Clean Proprietary Dataset' },
                                            { id: 'ml_engineer', label: 'Dedicated ML Engineer' },
                                            { id: 'prototype_working', label: 'Working Prototype' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleArrayItem('aiInfraReadiness', item.id)}
                                                className={`px-4 py-3 rounded-xl border transition-all flex items-center justify-between group text-left ${formData.aiInfraReadiness?.includes(item.id)
                                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                                                    : 'bg-slate-950/30 text-slate-400 border-white/10 hover:bg-slate-900'
                                                    }`}
                                            >
                                                <span>{item.label}</span>
                                                {formData.aiInfraReadiness?.includes(item.id) && <CheckCircle2 size={16} />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {(formData.projectType === 'memecoin' || formData.projectType === 'defi') && (
                                <div>
                                    <label className="block text-blue-200 mb-2 font-medium">Token Address (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.tokenAddress || ''}
                                        onChange={(e) => handleChange('tokenAddress', e.target.value)}
                                        placeholder="Solana Address (e.g. 7xW...)"
                                        className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-mono text-sm"
                                    />
                                    <p className="text-xs text-blue-300/60 mt-2">
                                        Providing this enables automatic on-chain checks (Mint Authority, LP status, etc).
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: STRATEGY */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div>
                                <label className="block text-blue-200 mb-2 font-medium">MVP Scope (6-12 months)</label>
                                <textarea
                                    value={formData.mvpScope}
                                    onChange={(e) => handleChange('mvpScope', e.target.value)}
                                    placeholder="What is the realistic MVP you can ship?"
                                    className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none min-h-[120px]"
                                />
                            </div>

                            <div>
                                <label className="block text-blue-200 mb-2 font-medium">Go-to-Market / First Users</label>
                                <textarea
                                    value={formData.goToMarketPlan}
                                    onChange={(e) => handleChange('goToMarketPlan', e.target.value)}
                                    placeholder="Who are your first users and how will you reach them?"
                                    className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none min-h-[120px]"
                                />
                            </div>

                            {(formData.projectType === 'memecoin' || formData.projectType === 'defi') && (
                                <div>
                                    <label className="block text-blue-200 mb-2 font-medium">Launch & Liquidity Plan</label>
                                    <textarea
                                        value={formData.launchLiquidityPlan}
                                        onChange={(e) => handleChange('launchLiquidityPlan', e.target.value)}
                                        placeholder="Liquidity, LP lock, anti-rug measures..."
                                        className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none min-h-[120px]"
                                    />
                                </div>
                            )}
                        </div>
                    )}


                    {/* STEP 4: GOALS */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div>
                                <label className="block text-blue-200 mb-2 font-medium">What is "Success" to you?</label>

                                {/* ADAPTIVE GOAL INPUTS */}
                                {formData.projectType === 'memecoin' ? (
                                    <div className="grid grid-cols-1 gap-4 animate-in fade-in">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Target Market Cap (3mo)</label>
                                            <input
                                                type="text"
                                                value={formData.targetMarketCap || ''}
                                                onChange={(e) => {
                                                    handleChange('targetMarketCap', e.target.value);
                                                    handleChange('successDefinition', `Target MC: ${e.target.value}`); // Auto-fill required field
                                                }}
                                                placeholder="e.g. $10M"
                                                className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                                            />
                                        </div>
                                    </div>
                                ) : formData.projectType === 'defi' ? (
                                    <div className="grid grid-cols-1 gap-4 animate-in fade-in">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Target TVL / Volume</label>
                                            <input
                                                type="text"
                                                value={formData.targetTVL || ''}
                                                onChange={(e) => {
                                                    handleChange('targetTVL', e.target.value);
                                                    handleChange('successDefinition', `Target TVL: ${e.target.value}`);
                                                }}
                                                placeholder="e.g. $1M TVL"
                                                className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                                            />
                                        </div>
                                    </div>
                                ) : formData.projectType === 'ai' ? (
                                    <div className="grid grid-cols-1 gap-4 animate-in fade-in">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Target Users / MRR</label>
                                            <input
                                                type="text"
                                                value={formData.targetDAU || ''}
                                                onChange={(e) => {
                                                    handleChange('targetDAU', e.target.value);
                                                    handleChange('successDefinition', `Target Users: ${e.target.value}`);
                                                }}
                                                placeholder="e.g. 1000 Daily Users"
                                                className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={formData.successDefinition}
                                        onChange={(e) => handleChange('successDefinition', e.target.value)}
                                        placeholder="e.g. 10k users, $1M TVL, Mainnet launch..."
                                        className="w-full p-4 bg-slate-950/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                                    />
                                )}
                                {errors.successDefinition && <p className="text-red-400 text-sm mt-2">{errors.successDefinition}</p>}
                            </div>

                            <div>
                                <label className="block text-blue-200 mb-3 font-medium">Response Style</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {[
                                        { id: 'short', label: 'Short Verdict', desc: 'Direct & Brutal' },
                                        { id: 'full', label: 'Full Report', desc: 'Detailed Analysis' },
                                        { id: 'next_steps', label: 'Actionable', desc: 'Focus on Tasks' },
                                    ].map((style) => (
                                        <button
                                            key={style.id}
                                            type="button"
                                            onClick={() => handleChange('responseStyle', style.id)}
                                            className={`p-4 rounded-xl border text-left transition-all ${formData.responseStyle === style.id
                                                ? 'bg-purple-600/20 text-purple-200 border-purple-500 ring-1 ring-purple-500'
                                                : 'bg-slate-950/30 text-slate-400 border-white/10 hover:bg-slate-900'
                                                }`}
                                        >
                                            <div className="font-semibold mb-1">{style.label}</div>
                                            <div className="text-xs opacity-60">{style.desc}</div>
                                        </button>
                                    ))}
                                </div>
                                {errors.responseStyle && <p className="text-red-400 text-sm mt-2">{errors.responseStyle}</p>}
                            </div>

                            <div>
                                <label className="block text-blue-200 mb-2 font-medium">Focus Hints (Optional)</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Meme Potential', 'Rug Risk', 'Long Term Viability', 'Technical Feasibility', 'Marketing Strategy'].map((hint) => (
                                        <button
                                            key={hint}
                                            type="button"
                                            onClick={() => toggleArrayItem('focusHints', hint)}
                                            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${formData.focusHints?.includes(hint)
                                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                                                : 'bg-slate-800 text-slate-400 border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            {hint}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Footer Navigation */}
            <div className="px-8 py-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                    {currentStep > 0 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                    )}
                </div>

                <div>

                    {currentStep < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95"
                        >
                            Next Step <ArrowRight size={18} />
                        </button>
                    ) : (
                        <div className="flex flex-col items-end gap-2">
                            {quota && (
                                <div className={`text-xs font-medium px-3 py-1 rounded-full border ${quota.remaining === 0
                                    ? 'bg-red-500/10 text-red-300 border-red-500/30'
                                    : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                    }`}>
                                    {quota.remaining === -1
                                        ? `Daily Limit: ${quota.limit}`
                                        : quota.remaining === 0
                                            ? `Daily Limit Reached (${quota.limit}/${quota.limit})`
                                            : `${quota.remaining} / ${quota.limit} Free Evals Left`
                                    }
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || (quota?.remaining === 0)}
                                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:brightness-110 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-green-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
                            >
                                {isSubmitting ? (
                                    <>Evaluating...</>
                                ) : (
                                    <>Run Evaluation <Sparkles size={18} /></>
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
