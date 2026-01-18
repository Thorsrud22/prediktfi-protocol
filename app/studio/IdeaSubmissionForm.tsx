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

    // ----------------------------------------------------------------
    // RENDER (TERMINAL UI)
    // ----------------------------------------------------------------
    const progress = ((currentStep + 1) / STEPS.length) * 100;
    const currentStepConfig = STEPS[currentStep];

    return (
        <div className="w-full max-w-4xl mx-auto bg-slate-900/95 border border-white/10 shadow-xl rounded-xl relative overflow-hidden font-sans">
            {/* Top Bar / Status Line */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-blue-400 font-mono">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    SYSTEM_READY
                </div>
                <div className="text-xs text-white/40 font-mono">
                    SESSION_ID: {Math.random().toString(36).substring(7).toUpperCase()}
                </div>
            </div>

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
                    <span>INIT</span>
                    <span>EXEC</span>
                    <span>STRAT</span>
                    <span>GOAL</span>
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
                                        { id: 'memecoin', label: 'MEMECOIN', desc: 'VIRAL / HYPE' },
                                        { id: 'defi', label: 'DEFI', desc: 'YIELD / PROTOCOL' },
                                        { id: 'ai', label: 'AI AGENT', desc: 'LLM / INFRA' }
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
                                    placeholder="> INPUT PROJECT DESCRIPTION..."
                                    className="w-full p-4 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none min-h-[150px] font-mono text-sm leading-relaxed rounded-xl"
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-2 font-mono">:: ERROR :: {errors.description}</p>}
                            </div>

                            {/* MEMECOIN SPECIFIC */}
                            {formData.projectType === 'memecoin' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-pink-500 pl-2">
                                            Community Vibe
                                        </label>
                                        <select
                                            value={formData.memecoinVibe || ''}
                                            onChange={(e) => handleChange('memecoinVibe', e.target.value)}
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white focus:outline-none focus:border-pink-500 text-sm font-mono appearance-none rounded-lg"
                                        >
                                            <option value="" disabled> SELECT_VIBE</option>
                                            <option value="cult">CULT_CONVICTION</option>
                                            <option value="chill">CHILL_LOW_STRESS</option>
                                            <option value="raiding">AGGRESSIVE_RAIDING</option>
                                            <option value="utility">UTILITY_HIDDEN</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-pink-500 pl-2">
                                            Narrative Vector
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.memecoinNarrative || ''}
                                            onChange={(e) => handleChange('memecoinNarrative', e.target.value)}
                                            placeholder="> e.g. POLITIFI, CATS..."
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm font-mono rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* DEFI SPECIFIC */}
                            {formData.projectType === 'defi' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                                            Mechanism Design
                                        </label>
                                        <select
                                            value={formData.defiMechanism || ''}
                                            onChange={(e) => handleChange('defiMechanism', e.target.value)}
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white focus:outline-none focus:border-blue-500 text-sm font-mono appearance-none rounded-lg"
                                        >
                                            <option value="" disabled> SELECT_MECHANISM</option>
                                            <option value="staking">STAKING_YIELD</option>
                                            <option value="lending">LENDING_BORROWING</option>
                                            <option value="amm">DEX_AMM</option>
                                            <option value="derivatives">PERPS_OPTIONS</option>
                                            <option value="aggregator">AGGREGATOR</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-blue-500 pl-2">
                                            Revenue Model
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.defiRevenue || ''}
                                            onChange={(e) => handleChange('defiRevenue', e.target.value)}
                                            placeholder="> e.g. 0.3% SWAP FEES..."
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm font-mono rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* AI SPECIFIC */}
                            {formData.projectType === 'ai' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-cyan-500 pl-2">
                                            Model Strategy
                                        </label>
                                        <select
                                            value={formData.aiModelType || ''}
                                            onChange={(e) => handleChange('aiModelType', e.target.value)}
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-500 text-sm font-mono appearance-none rounded-lg"
                                        >
                                            <option value="" disabled> SELECT_STRATEGY</option>
                                            <option value="wrapper">WRAPPER_API</option>
                                            <option value="finetuned">FINE_TUNED_MODEL</option>
                                            <option value="agents">AUTONOMOUS_AGENTS</option>
                                            <option value="training">TRAINING_INFRA</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-cyan-500 pl-2">
                                            Data Moat
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.aiDataMoat || ''}
                                            onChange={(e) => handleChange('aiDataMoat', e.target.value)}
                                            placeholder="> e.g. PROPRIETARY DATASET..."
                                            className="w-full p-3 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500 text-sm font-mono rounded-lg"
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
                                    Resource Verification
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
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                                    : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="uppercase text-xs font-bold tracking-wider">[ {resource} ]</span>
                                                {formData.resources?.includes(resource) && <span className="text-[10px]">VERIFIED</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* MEMECOIN RESOURCES */}
                                {formData.projectType === 'memecoin' && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'art_ready', label: 'ART_METADATA_READY' },
                                            { id: 'kols_lined_up', label: 'KOLS_WARBAND_READY' },
                                            { id: 'community_manager', label: 'COMMUNITY_MOD' },
                                            { id: 'marketing_budget', label: 'BUDGET_GT_5K' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleArrayItem('memecoinLaunchPreparation', item.id)}
                                                className={`px-4 py-3 border transition-all flex items-center justify-between text-left rounded-none ${formData.memecoinLaunchPreparation?.includes(item.id)
                                                    ? 'bg-pink-500/10 text-pink-500 border-pink-500'
                                                    : 'bg-black text-white/40 border-white/20 hover:border-white/40'
                                                    }`}
                                            >
                                                <span className="text-xs font-bold tracking-wider">{item.label}</span>
                                                {formData.memecoinLaunchPreparation?.includes(item.id) ? (
                                                    <span className="text-[10px] bg-pink-500/20 px-1">CONFIRMED</span>
                                                ) : <span className="text-[10px] opacity-20">UNVERIFIED</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* DEFI RESOURCES */}
                                {formData.projectType === 'defi' && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'audit_planned', label: 'SECURITY_AUDIT' },
                                            { id: 'multisig_setup', label: 'MULTISIG_DAO_OP' },
                                            { id: 'timelock', label: 'TIMELOCK_CONTRACTS' },
                                            { id: 'testnet_live', label: 'TESTNET_DEPLOYED' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleArrayItem('defiSecurityMarks', item.id)}
                                                className={`px-4 py-3 border transition-all flex items-center justify-between text-left rounded-none ${formData.defiSecurityMarks?.includes(item.id)
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500'
                                                    : 'bg-black text-white/40 border-white/20 hover:border-white/40'
                                                    }`}
                                            >
                                                <span className="text-xs font-bold tracking-wider">{item.label}</span>
                                                {formData.defiSecurityMarks?.includes(item.id) ? (
                                                    <span className="text-[10px] bg-blue-500/20 px-1">SECURED</span>
                                                ) : <span className="text-[10px] opacity-20">MISSING</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* AI RESOURCES */}
                                {formData.projectType === 'ai' && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'gpu_access', label: 'GPU_COMPUTE_ACCESS' },
                                            { id: 'proprietary_data', label: 'CLEAN_DATASET' },
                                            { id: 'ml_engineer', label: 'ML_ENGINEER_LEAD' },
                                            { id: 'prototype_working', label: 'PROTOTYPE_ONLINE' }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleArrayItem('aiInfraReadiness', item.id)}
                                                className={`px-4 py-3 border transition-all flex items-center justify-between text-left rounded-none ${formData.aiInfraReadiness?.includes(item.id)
                                                    ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500'
                                                    : 'bg-black text-white/40 border-white/20 hover:border-white/40'
                                                    }`}
                                            >
                                                <span className="text-xs font-bold tracking-wider">{item.label}</span>
                                                {formData.aiInfraReadiness?.includes(item.id) ? (
                                                    <span className="text-[10px] bg-cyan-500/20 px-1">READY</span>
                                                ) : <span className="text-[10px] opacity-20">NOT_READY</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {(formData.projectType === 'memecoin' || formData.projectType === 'defi') && (
                                <div>
                                    <label className="block text-white/60 mb-3 text-xs uppercase tracking-widest border-l-2 border-green-500 pl-2">
                                        Chain Analytics (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tokenAddress || ''}
                                        onChange={(e) => handleChange('tokenAddress', e.target.value)}
                                        placeholder="> SOLANA CA (7xW...)"
                                        className="w-full p-4 bg-black border border-white/20 text-white placeholder-white/20 focus:outline-none focus:border-green-500 text-sm font-mono"
                                    />
                                    <p className="text-[10px] text-green-500/60 mt-2 font-mono">
                                        // DETECTS_RUG_RISK()
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
                                    placeholder="> DEFINE_DELIVERABLES"
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
                                    placeholder="> DEFINE_TARGET_USERS"
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
                                        placeholder="> DEFINE_LP_SETUP"
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
                                                placeholder="> TARGET_MCAP (e.g. $10M)"
                                                className="w-full p-4 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm font-mono rounded-lg"
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
                                                placeholder="> TARGET_TVL (e.g. $1M)"
                                                className="w-full p-4 bg-black/40 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 text-sm font-mono rounded-lg"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={formData.successDefinition}
                                        onChange={(e) => handleChange('successDefinition', e.target.value)}
                                        placeholder="> DEFINE_SUCCESS"
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
                                        { id: 'short', label: 'SHORT_VERDICT', desc: 'DIRECT_BRUTAL' },
                                        { id: 'full', label: 'FULL_REPORT', desc: 'DEEP_ANALYSIS' },
                                        { id: 'next_steps', label: 'ACTION_PLAN', desc: 'TASK_LIST' },
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
                                            {formData.responseStyle === style.id && <span className="absolute top-3 right-3 text-blue-500 text-[10px] bg-blue-500/10 px-2 py-0.5 rounded-full">[ACTIVE]</span>}
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
                                    QUOTA: {quota.remaining}/{quota.limit}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || (quota?.remaining === 0)}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:grayscale rounded-full"
                            >
                                {isSubmitting ? 'PROCESSING...' : 'RUN_EVALUATION'} <Sparkles size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
