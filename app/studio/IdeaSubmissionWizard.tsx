'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Check, ChevronRight, Command, CornerDownLeft, Sparkles, Zap, Globe, Cpu, Palette, Gamepad2, MoreHorizontal, History } from 'lucide-react';
import { cn } from '../lib/utils'; // Correct relative import for test compatibility

// Types for form data
export type ProjectType = 'memecoin' | 'defi' | 'ai' | 'nft' | 'gaming' | 'other' | null;

export interface WizardFormData {
    projectType: ProjectType;
    name: string; // Ticker or Project Name
    description: string;
    website?: string; // Optional context
    // Contextual fields
    memecoinVibe?: string;
    memecoinNarrative?: string;
    defiMechanism?: string;
    defiRevenue?: string;
    aiModelType?: string;
    aiDataMoat?: string;
    teamSize?: string;
    successDefinition?: string;
}

interface IdeaSubmissionWizardProps {
    onSubmit: (data: WizardFormData) => void;
    initialData?: Partial<WizardFormData>;
    isSubmitting?: boolean;
}

const STEPS = [
    { id: 'sector', title: 'Select Sector', subtitle: 'What area does your project belong to?' },
    { id: 'details', title: 'Project Identity', subtitle: 'Give it a name or ticker.' },
    { id: 'pitch', title: 'The Pitch', subtitle: 'Describe your vision in detail.' },
    { id: 'insights', title: 'Strategic Insights', subtitle: 'Add more context for a deeper analysis.' },
    { id: 'review', title: 'Ready to Launch?', subtitle: 'Review your submission.' }
];

export default function IdeaSubmissionWizard({ onSubmit, initialData, isSubmitting }: IdeaSubmissionWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1); // 1 for forward, -1 for back
    const [formData, setFormData] = useState<WizardFormData>({
        projectType: initialData?.projectType || null,
        name: initialData?.name || '',
        description: initialData?.description || '',
        website: initialData?.website || '',
        memecoinVibe: initialData?.memecoinVibe || '',
        memecoinNarrative: initialData?.memecoinNarrative || '',
        defiMechanism: initialData?.defiMechanism || '',
        defiRevenue: initialData?.defiRevenue || '',
        aiModelType: initialData?.aiModelType || '',
        aiDataMoat: initialData?.aiDataMoat || '',
        teamSize: initialData?.teamSize || 'solo',
        successDefinition: initialData?.successDefinition || ''
    });

    const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

    // Use a ref to always have the absolute latest data for validation
    // This prevents race conditions where handleNext sees stale state
    const formDataRef = useRef<WizardFormData>(formData);
    // Update ref whenever state changes from external sources (initialData)
    useEffect(() => {
        if (initialData) {
            const newData = {
                projectType: initialData.projectType || null,
                name: initialData.name || '',
                description: initialData.description || '',
                website: initialData.website || '',
                memecoinVibe: initialData.memecoinVibe || '',
                memecoinNarrative: initialData.memecoinNarrative || '',
                defiMechanism: initialData.defiMechanism || '',
                defiRevenue: initialData.defiRevenue || '',
                aiModelType: initialData.aiModelType || '',
                aiDataMoat: initialData.aiDataMoat || '',
                teamSize: initialData.teamSize || 'solo',
                successDefinition: initialData.successDefinition || ''
            };
            formDataRef.current = newData;
            setFormData(newData);
        }
    }, [initialData]);

    const wizardRef = useRef<HTMLDivElement>(null);

    const nameInputRef = useRef<HTMLInputElement>(null);
    const descInputRef = useRef<HTMLTextAreaElement>(null);
    const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isNavigatingRef = useRef(false);

    // Auto-focus logic & Scroll to top
    useEffect(() => {
        // Scroll to the top of the page on every step change for stability
        // Using instant scroll and minimal delay to prevent "dead zones" during smooth transitions
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }, 10);

        if (currentStep === 1) {
            // Slightly longer delay to ensure scroll finishes
            setTimeout(() => nameInputRef.current?.focus(), 600);
        } else if (currentStep === 2) {
            setTimeout(() => descInputRef.current?.focus(), 600);
        }
    }, [currentStep]);

    const handleNext = (forcedData?: WizardFormData) => {
        if (isNavigatingRef.current) return;
        isNavigatingRef.current = true;

        const dataToValidate = forcedData || formDataRef.current;

        // Clear any pending auto-advance
        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
            navigationTimeoutRef.current = null;
        }

        // Validation helper
        const getMeaningfulLength = (text: string) => text.replace(/\s/g, '').length;

        // Validation check before proceeding - now uses the most recent data
        if (currentStep === 0 && !dataToValidate.projectType) return;

        if (currentStep === 1) {
            const trimmedName = dataToValidate.name.trim();
            if (trimmedName.length < 3) {
                setErrors(prev => ({ ...prev, name: trimmedName.length === 0 ? "Name is required" : "Name must be at least 3 characters" }));
                isNavigatingRef.current = false;
                return;
            }
        }

        if (currentStep === 2) {
            const meaningfulLength = getMeaningfulLength(dataToValidate.description);
            if (meaningfulLength < 10) {
                setErrors(prev => ({ ...prev, description: meaningfulLength === 0 ? "Pitch is required" : "Pitch must be at least 10 non-space characters" }));
                isNavigatingRef.current = false;
                return;
            }
        }

        if (currentStep < STEPS.length - 1) {
            isNavigatingRef.current = true;
            setDirection(1);

            // Skip insights step if no contextual fields for sector
            let targetStep = currentStep + 1;
            if (STEPS[targetStep].id === 'insights' && !hasContextualFields(dataToValidate.projectType)) {
                targetStep += 1;
            }

            setCurrentStep(targetStep);

            // Snappy cooldown for better responsiveness
            setTimeout(() => {
                isNavigatingRef.current = false;
            }, 50);
        } else {
            onSubmit(formData);
        }
    };

    const handleBack = () => {
        if (isNavigatingRef.current || currentStep === 0) return;
        isNavigatingRef.current = true;

        // Clear any pending auto-advance
        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
            navigationTimeoutRef.current = null;
        }

        isNavigatingRef.current = true;
        setDirection(-1);

        // Skip insights step if no contextual fields for sector
        let targetStep = currentStep - 1;
        if (STEPS[targetStep].id === 'insights' && !hasContextualFields(formData.projectType)) {
            targetStep -= 1;
        }

        setCurrentStep(targetStep);

        // Snappy cooldown for better responsiveness
        setTimeout(() => {
            isNavigatingRef.current = false;
        }, 50);
    };

    const hasContextualFields = (type: ProjectType) => {
        return ['memecoin', 'defi', 'ai'].includes(type as string);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Validation before proceeding
        const getMeaningfulLength = (text: string) => text.replace(/\s/g, '').length;

        // Command/Control + Enter logic for Step 2 (Multiline)
        if (currentStep === 2 && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            const meaningfulLength = getMeaningfulLength(formData.description);
            if (meaningfulLength < 10) {
                setErrors(prev => ({ ...prev, description: meaningfulLength === 0 ? "Pitch is required" : "Pitch must be at least 10 non-space characters" }));
                return;
            }
            handleNext();
            return;
        }

        // Standard Enter logic for single-line fields
        if (e.key === 'Enter' && !e.shiftKey) {
            // Prevent default behavior for textarea unless Cmd/Ctrl is pressed (handled above)
            if (currentStep === 2 && (e.target as HTMLElement).tagName === 'TEXTAREA') {
                return;
            }

            if (currentStep === 0 && !formData.projectType) return;

            if (currentStep === 1) {
                const trimmedName = formDataRef.current.name.trim();
                if (trimmedName.length < 3) {
                    setErrors(prev => ({ ...prev, name: trimmedName.length === 0 ? "Name is required" : "Name must be at least 3 characters" }));
                    return;
                }
            }

            if (currentStep === 3) {
                // Strategic insights don't have hard validation yet, but we allow Enter to proceed
            }

            if (currentStep === 4) {
                // Review step
                e.preventDefault();
                onSubmit(formData);
                return;
            }

            e.preventDefault();
            handleNext();
        }
    };

    // Command + Enter to submit from anywhere (power user feature)
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (currentStep === STEPS.length - 1) {
                    onSubmit(formData);
                } else {
                    // Quick skip logic could go here, but let's stick to standard flow
                    // handleNext(); 
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown);
            if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
        };
    }, [currentStep, formData, onSubmit]);

    const updateField = (field: keyof WizardFormData, value: any) => {
        // Immediate ref update for synchronous validation in handleNext
        const updated = { ...formDataRef.current, [field]: value };
        formDataRef.current = updated;
        setFormData(updated);

        // Clear errors when user types
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Calculate progress
    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <div ref={wizardRef} className="w-full max-w-4xl mx-auto min-h-[500px] flex flex-col relative px-4 sm:px-0 pb-32 sm:pb-0 scroll-mt-32 pt-12">

            {/* Progress Bar */}
            {/* Progress & Step Counter Wrapper */}
            <div className="flex items-center justify-between mb-12 gap-6">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden relative">
                    <div
                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="text-[10px] font-mono text-white/30 whitespace-nowrap tracking-widest">
                    STEP {currentStep + 1} / {STEPS.length}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative mt-4">
                {/* HEADERS */}
                <div key={currentStep} className="mb-12 text-center sm:text-left space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
                        {STEPS[currentStep].title}
                    </h2>
                    <p className="text-lg text-white/50 font-light">
                        {STEPS[currentStep].subtitle}
                    </p>
                </div>

                {/* DYNAMIC STEPS */}
                <div className="min-h-[350px] sm:min-h-[440px] flex flex-col justify-center relative z-10">

                    {/* STEP 0: SECTOR SELECTION */}
                    {currentStep === 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-right-8 duration-500">
                            {[
                                { id: 'ai', icon: Cpu, label: 'AI Agent', desc: 'LLM & Infra' },
                                { id: 'defi', icon: Globe, label: 'DeFi / Utility', desc: 'Protocol & Yield' },
                                { id: 'memecoin', icon: Zap, label: 'Memecoin', desc: 'Viral & Hype' },
                                { id: 'nft', icon: Palette, label: 'NFT / Art', desc: 'Digital Collectibles' },
                                { id: 'gaming', icon: Gamepad2, label: 'Gaming', desc: 'GameFi & Metaverse' },
                                { id: 'other', icon: MoreHorizontal, label: 'Other', desc: 'Everything Else' },
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        // Update state and advance immediately with fresh data
                                        const newType = option.id as ProjectType;
                                        const updated = { ...formDataRef.current, projectType: newType };
                                        formDataRef.current = updated;
                                        setFormData(updated);
                                        handleNext(updated);
                                    }}
                                    className={cn(
                                        "group relative p-4 sm:p-5 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center text-center gap-2 hover:scale-[1.02] select-none",
                                        formData.projectType === option.id
                                            ? "bg-blue-600 border-blue-400 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]"
                                            : "bg-[#0B1221] border-white/10 hover:border-white/20 hover:bg-white/5"
                                    )}
                                >
                                    <div className={cn(
                                        "p-3 rounded-full transition-colors",
                                        formData.projectType === option.id ? "bg-white/20 text-white" : "bg-white/5 text-white/60 group-hover:text-white"
                                    )}>
                                        <option.icon size={24} />
                                    </div>
                                    <div className="min-h-[44px] flex flex-col justify-center">
                                        <h3 className="text-base sm:text-lg font-bold text-white leading-tight">{option.label}</h3>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">{option.desc}</p>
                                    </div>

                                    {/* Selection Indicator */}
                                    <div className={cn(
                                        "absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        formData.projectType === option.id ? "border-white bg-white text-blue-600 scale-100" : "border-white/10 scale-0 group-hover:scale-90"
                                    )}>
                                        <Check size={14} strokeWidth={4} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* STEP 1: NAME / TICKER */}
                    {currentStep === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-2xl">
                            <div className="relative group space-y-2">
                                <label
                                    htmlFor="project-name"
                                    className="text-[10px] font-mono text-white/30 uppercase tracking-widest block"
                                >
                                    {formData.projectType === 'memecoin' ? "Ticker Symbol" : "Project Name"}
                                </label>
                                <input
                                    ref={nameInputRef}
                                    id="project-name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={formData.projectType === 'memecoin' ? "$TICKER" : "Project Name"}
                                    className="w-full bg-transparent text-4xl sm:text-6xl font-bold text-white placeholder:text-white/10 outline-none py-2 transition-colors font-mono uppercase tracking-tight"
                                    autoComplete="off"
                                    aria-describedby={cn(errors.name ? "name-error" : undefined, "name-helper")}
                                    aria-invalid={!!errors.name}
                                />
                                {errors.name && (
                                    <div
                                        id="name-error"
                                        role="alert"
                                        className="absolute left-0 -bottom-6 text-sm text-red-400 font-mono animate-in fade-in slide-in-from-top-1 duration-300"
                                    >
                                        {errors.name}
                                    </div>
                                )}
                                <div className="absolute right-0 bottom-4 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded">Enter ↵</span>
                                </div>
                            </div>
                            <p id="name-helper" className="mt-8 text-white/40 flex items-center gap-2">
                                <Sparkles size={16} className="text-blue-400" />
                                {formData.projectType === 'memecoin'
                                    ? "Catchy tickers perform 40% better on analysis."
                                    : "Short, memorable names resonate best with VCs."}
                            </p>
                        </div>
                    )}

                    {/* STEP 2: DESCRIPTION / PITCH */}
                    {currentStep === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="relative group space-y-3">
                                <label
                                    htmlFor="project-pitch"
                                    className="text-[10px] font-mono text-white/30 uppercase tracking-widest block"
                                >
                                    The Pitch
                                </label>
                                <textarea
                                    ref={descInputRef}
                                    id="project-pitch"
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={
                                        formData.projectType === 'memecoin'
                                            ? "Explain the viral potential, community vibe, and core narrative..."
                                            : formData.projectType === 'ai'
                                                ? "Describe the model architecture, data source, and agent behavior..."
                                                : "Explain your mechanism, unique selling point, or narrative..."
                                    }
                                    className="w-full h-[300px] bg-white/5 rounded-xl border border-white/10 p-6 text-xl sm:text-2xl font-medium text-white placeholder:text-white/20 resize-none outline-none focus:border-blue-500 focus:bg-white/10 transition-all leading-relaxed"
                                    aria-describedby={cn(errors.description ? "pitch-error" : undefined, "pitch-counter")}
                                    aria-invalid={!!errors.description}
                                />
                                {errors.description && (
                                    <div
                                        id="pitch-error"
                                        role="alert"
                                        className="absolute left-0 -bottom-6 text-sm text-red-400 font-mono animate-in fade-in slide-in-from-top-1 duration-300"
                                    >
                                        {errors.description}
                                    </div>
                                )}
                                <div className="absolute bottom-6 right-6 flex items-center gap-4 pointer-events-none">
                                    <span
                                        id="pitch-counter"
                                        className={cn(
                                            "text-xs font-mono transition-colors",
                                            formData.description.replace(/\s/g, '').length >= 10 ? "text-emerald-400" : "text-white/30"
                                        )}
                                    >
                                        {formData.description.replace(/\s/g, '').length} meaningful chars (min 10)
                                    </span>
                                    <span className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded hidden sm:inline-block">
                                        Cmd + Enter ↵
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: STRATEGIC INSIGHTS (CONTEXTUAL) */}
                    {currentStep === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-8 max-w-2xl">
                            {formData.projectType === 'memecoin' && (
                                <>
                                    <div className="space-y-3">
                                        <label htmlFor="memecoin-vibe" className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Community Vibe</label>
                                        <input
                                            id="memecoin-vibe"
                                            type="text"
                                            value={formData.memecoinVibe}
                                            onChange={(e) => updateField('memecoinVibe', e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="e.g. Cult-like, Degen, Institutional-grade"
                                            className="w-full bg-transparent text-2xl sm:text-4xl font-bold text-white placeholder:text-white/10 outline-none border-b border-white/10 focus:border-blue-500 pb-2 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="memecoin-narrative" className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Primary Narrative</label>
                                        <input
                                            id="memecoin-narrative"
                                            type="text"
                                            value={formData.memecoinNarrative}
                                            onChange={(e) => updateField('memecoinNarrative', e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="e.g. AI-driven, Real World Asset, Joke"
                                            className="w-full bg-transparent text-2xl sm:text-4xl font-bold text-white placeholder:text-white/10 outline-none border-b border-white/10 focus:border-blue-500 pb-2 transition-colors"
                                        />
                                    </div>
                                </>
                            )}

                            {formData.projectType === 'defi' && (
                                <>
                                    <div className="space-y-3">
                                        <label htmlFor="defi-mechanism" className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Key Mechanism</label>
                                        <input
                                            id="defi-mechanism"
                                            type="text"
                                            value={formData.defiMechanism}
                                            onChange={(e) => updateField('defiMechanism', e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="e.g. Concentrated Liquidity, Lending"
                                            className="w-full bg-transparent text-2xl sm:text-4xl font-bold text-white placeholder:text-white/10 outline-none border-b border-white/10 focus:border-blue-500 pb-2 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="defi-revenue" className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Revenue Model</label>
                                        <input
                                            id="defi-revenue"
                                            type="text"
                                            value={formData.defiRevenue}
                                            onChange={(e) => updateField('defiRevenue', e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="e.g. Trading fees, Subscription"
                                            className="w-full bg-transparent text-2xl sm:text-4xl font-bold text-white placeholder:text-white/10 outline-none border-b border-white/10 focus:border-blue-500 pb-2 transition-colors"
                                        />
                                    </div>
                                </>
                            )}

                            {formData.projectType === 'ai' && (
                                <>
                                    <div className="space-y-3">
                                        <label htmlFor="ai-model-type" className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Model Type</label>
                                        <input
                                            id="ai-model-type"
                                            type="text"
                                            value={formData.aiModelType}
                                            onChange={(e) => updateField('aiModelType', e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="e.g. LLM-wrapper, Custom Training"
                                            className="w-full bg-transparent text-2xl sm:text-4xl font-bold text-white placeholder:text-white/10 outline-none border-b border-white/10 focus:border-blue-500 pb-2 transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="ai-data-moat" className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Data Moat</label>
                                        <input
                                            id="ai-data-moat"
                                            type="text"
                                            value={formData.aiDataMoat}
                                            onChange={(e) => updateField('aiDataMoat', e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="e.g. Proprietary dataset, Network effect"
                                            className="w-full bg-transparent text-2xl sm:text-4xl font-bold text-white placeholder:text-white/10 outline-none border-b border-white/10 focus:border-blue-500 pb-2 transition-colors"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {currentStep === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="bg-[#0B1221] border border-white/10 p-8 rounded-3xl space-y-8 max-w-2xl">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <div className="text-xs text-white/40 uppercase tracking-widest font-mono">Sector</div>
                                        <div className="text-xl text-white font-bold flex items-center gap-2">
                                            {formData.projectType === 'memecoin' && <Zap className="text-yellow-400" size={20} />}
                                            {formData.projectType === 'defi' && <Globe className="text-blue-400" size={20} />}
                                            {formData.projectType === 'ai' && <Cpu className="text-purple-400" size={20} />}
                                            <span className="uppercase">{formData.projectType}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs text-white/40 uppercase tracking-widest font-mono">Identity</div>
                                        <div className="text-xl text-white font-bold tracking-tight">{formData.name}</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs text-white/40 uppercase tracking-widest font-mono">The Pitch</div>
                                    <div className="text-base text-white/70 leading-relaxed italic border-l-2 border-white/10 pl-4">
                                        "{formData.description}"
                                    </div>
                                </div>

                                {hasContextualFields(formData.projectType) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                        {formData.projectType === 'memecoin' && (
                                            <>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] text-white/30 uppercase font-mono">Vibe</div>
                                                    <div className="text-sm text-white font-medium">{formData.memecoinVibe || 'Not specified'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] text-white/30 uppercase font-mono">Narrative</div>
                                                    <div className="text-sm text-white font-medium">{formData.memecoinNarrative || 'Not specified'}</div>
                                                </div>
                                            </>
                                        )}
                                        {formData.projectType === 'defi' && (
                                            <>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] text-white/30 uppercase font-mono">Mechanism</div>
                                                    <div className="text-sm text-white font-medium">{formData.defiMechanism || 'Not specified'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] text-white/30 uppercase font-mono">Revenue</div>
                                                    <div className="text-sm text-white font-medium">{formData.defiRevenue || 'Not specified'}</div>
                                                </div>
                                            </>
                                        )}
                                        {formData.projectType === 'ai' && (
                                            <>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] text-white/30 uppercase font-mono">Model</div>
                                                    <div className="text-sm text-white font-medium">{formData.aiModelType || 'Not specified'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] text-white/30 uppercase font-mono">Moat</div>
                                                    <div className="text-sm text-white font-medium">{formData.aiDataMoat || 'Not specified'}</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <div className="text-xs text-white/40 uppercase tracking-widest font-mono">Estimated Analysis Time</div>
                                    <div className="text-sm text-emerald-400 font-mono flex items-center gap-2">
                                        <History size={14} />
                                        {formData.projectType === 'memecoin' ? '~30 Seconds' : '~2 Minutes'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* NAVIGATION CONTROLS (Moved outside dynamic area and given high z-index) */}
            <div className="mt-12 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in duration-300 relative z-[110] pointer-events-auto">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {currentStep > 0 && (
                        <button
                            onClick={handleBack}
                            className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors font-mono uppercase text-xs tracking-widest"
                        >
                            Back
                        </button>
                    )}
                    {currentStep < 4 ? (
                        <button
                            onClick={() => handleNext()}
                            className="flex-1 sm:flex-none group px-10 py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-all font-mono uppercase text-xs tracking-widest relative z-[111] cursor-pointer pointer-events-auto select-none"
                        >
                            {currentStep === 3 || (currentStep === 2 && !hasContextualFields(formData.projectType)) ? 'Review' : 'Continue'}
                            <CornerDownLeft size={14} className="group-hover:translate-x-1 transition-transform pointer-events-none" />
                        </button>
                    ) : (
                        <button
                            onClick={() => handleNext()}
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none px-10 py-4 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-gray-200 transition-all font-mono uppercase text-xs tracking-widest shadow-lg shadow-white/5 relative z-[111] pointer-events-auto select-none"
                        >
                            <Sparkles size={16} className="pointer-events-none" />
                            {isSubmitting ? 'Analyzing...' : 'Generate Report'}
                            <ArrowRight size={16} className="pointer-events-none" />
                        </button>
                    )}
                </div>

                <div className="hidden sm:flex items-center gap-4 ml-auto text-xs font-mono text-white/30">
                    <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Tab</span> to navigate</span>
                    {currentStep === 0 && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Click</span> to select</span>}
                    {currentStep === 1 && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to proceed</span>}
                    {currentStep === 2 && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Cmd + Enter</span> to proceed</span>}
                    {currentStep === 3 && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to review</span>}
                    {currentStep === 4 && <span className="flex items-center gap-1"><span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Enter</span> to launch</span>}
                </div>
            </div>
        </div>
    );
}
