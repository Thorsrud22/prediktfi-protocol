'use client';

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useWizardState } from './wizard/hooks/useWizardState';
import { useWizardNavigation } from './wizard/hooks/useWizardNavigation';
import { useWizardPersistence } from './wizard/hooks/useWizardPersistence';
import { useFocusManagement } from './wizard/hooks/useFocusManagement';
import { WIZARD_CONSTANTS, STEPS, STEP_INDEX } from './wizard/constants';
import { WizardErrors, WizardFormData } from './wizard/types';
import { getCategoryContextualFields } from '@/lib/ideaCategories';

import { WizardProgress } from './wizard/components/WizardProgress';
import { WizardNavigation } from './wizard/components/WizardNavigation';
import { SectorStep } from './wizard/steps/SectorStep';
import { IdentityStep } from './wizard/steps/IdentityStep';
import { PitchStep } from './wizard/steps/PitchStep';
import { ContextStep } from './wizard/steps/ContextStep';
import { ReviewStep } from './wizard/steps/ReviewStep';

interface IdeaSubmissionWizardProps {
    onSubmit: (data: WizardFormData) => void;
    initialData?: Partial<WizardFormData>;
    isSubmitting?: boolean;
}

const getMeaningfulLength = (text: string) => text.replace(/\s/g, '').length;
type StepDirection = 1 | -1;

function getStepValidity(
    step: number,
    data: WizardFormData
): { valid: boolean; errors: WizardErrors } {
    switch (step) {
        case STEP_INDEX.SECTOR: {
            if (!data.projectType) {
                return { valid: false, errors: { projectType: 'Please select a sector' } };
            }
            return { valid: true, errors: {} };
        }
        case STEP_INDEX.DETAILS: {
            const trimmed = data.name.trim();
            if (trimmed.length < WIZARD_CONSTANTS.MIN_NAME_LENGTH) {
                return {
                    valid: false,
                    errors: {
                        name: trimmed.length === 0
                            ? 'Name is required'
                            : `Name must be at least ${WIZARD_CONSTANTS.MIN_NAME_LENGTH} characters`,
                    },
                };
            }
            return { valid: true, errors: {} };
        }
        case STEP_INDEX.PITCH: {
            const meaningful = getMeaningfulLength(data.description);
            if (meaningful < WIZARD_CONSTANTS.MIN_PITCH_CHARS) {
                return {
                    valid: false,
                    errors: {
                        description: meaningful === 0
                            ? 'Pitch is required'
                            : `Pitch must be at least ${WIZARD_CONSTANTS.MIN_PITCH_CHARS} non-space characters`,
                    },
                };
            }
            return { valid: true, errors: {} };
        }
        case STEP_INDEX.INSIGHTS:
        case STEP_INDEX.REVIEW:
            return { valid: true, errors: {} };
        default:
            return { valid: true, errors: {} };
    }
}

export default function IdeaSubmissionWizard({
    onSubmit,
    initialData,
    isSubmitting = false,
}: IdeaSubmissionWizardProps) {
    const reduceMotion = useReducedMotion();
    const [stepDirection, setStepDirection] = useState<StepDirection>(1);

    const {
        formData,
        formDataRef,
        errors,
        setErrors,
        updateField,
        hydrateForm,
    } = useWizardState(initialData);

    const {
        currentStep,
        setCurrentStep,
        handleNext: navigateNext,
        handleBack,
    } = useWizardNavigation(formData.projectType);

    const {
        isLoaded,
        showSavedMsg,
        clearStorage,
    } = useWizardPersistence(formData, currentStep, hydrateForm, setCurrentStep);

    const { nameInputRef, descInputRef } = useFocusManagement(currentStep);

    const canGoNext = useMemo(
        () => getStepValidity(currentStep, formData).valid,
        [currentStep, formData]
    );
    const hasContextualFields = useMemo(
        () => getCategoryContextualFields(formData.projectType).length > 0,
        [formData.projectType]
    );
    const nextLabel: 'Continue' | 'Review' = useMemo(() => (
        currentStep === STEP_INDEX.INSIGHTS || (currentStep === STEP_INDEX.PITCH && !hasContextualFields)
            ? 'Review'
            : 'Continue'
    ), [currentStep, hasContextualFields]);

    const finalizeSubmission = useCallback(
        (submission?: WizardFormData) => {
            clearStorage();
            onSubmit(submission ?? formDataRef.current);
        },
        [clearStorage, onSubmit, formDataRef]
    );

    const handleNext = () => {
        const data = formDataRef.current;
        const { valid, errors: stepErrors } = getStepValidity(currentStep, data);

        if (!valid) {
            setErrors(stepErrors);
            return;
        }

        if (currentStep < STEPS.length - 1) {
            setStepDirection(1);
            navigateNext();
        } else {
            finalizeSubmission(data);
        }
    };

    const handleBackWithDirection = useCallback(() => {
        setStepDirection(-1);
        handleBack();
    }, [handleBack]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (currentStep === STEP_INDEX.PITCH && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleNext();
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            if (currentStep === STEP_INDEX.PITCH && (e.target as HTMLElement).tagName === 'TEXTAREA') {
                return;
            }
            e.preventDefault();
            handleNext();
        }
    };

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && currentStep === STEP_INDEX.REVIEW) {
                e.preventDefault();
                finalizeSubmission(formDataRef.current);
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [currentStep, finalizeSubmission, formDataRef]);

    if (!isLoaded) {
        return (
            <div className="w-full max-w-4xl mx-auto min-h-[300px] flex flex-col px-4 sm:px-0 pt-0">
                <div className="flex items-center gap-2 mb-8">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className="h-1.5 flex-1 rounded-full bg-white/10 animate-pulse"
                        />
                    ))}
                </div>
                <div className="space-y-4 animate-pulse">
                    <div className="h-10 w-3/5 bg-white/10 rounded-lg" />
                    <div className="h-5 w-2/5 bg-white/[0.06] rounded-md" />
                    <div className="mt-12 h-40 w-full bg-white/[0.04] rounded-xl" />
                </div>
            </div>
        );
    }

    const renderStep = () => {
        switch (currentStep) {
            case STEP_INDEX.SECTOR:
                return <SectorStep formData={formData} updateField={updateField} errors={errors} />;
            case STEP_INDEX.DETAILS:
                return (
                    <IdentityStep
                        ref={nameInputRef}
                        formData={formData}
                        updateField={updateField}
                        errors={errors}
                        onKeyDown={handleKeyDown}
                    />
                );
            case STEP_INDEX.PITCH:
                return (
                    <PitchStep
                        ref={descInputRef}
                        formData={formData}
                        updateField={updateField}
                        errors={errors}
                        onKeyDown={handleKeyDown}
                    />
                );
            case STEP_INDEX.INSIGHTS:
                return (
                    <ContextStep
                        formData={formData}
                        updateField={updateField}
                        onKeyDown={handleKeyDown}
                    />
                );
            case STEP_INDEX.REVIEW:
                return <ReviewStep formData={formData} />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto min-h-[300px] flex flex-col relative px-4 sm:px-0 pb-20 sm:pb-0 scroll-mt-24 pt-0">
            <WizardProgress currentStep={currentStep} showSavedMsg={showSavedMsg} />

            <div className="relative mt-4">
                <div
                    key={currentStep}
                    className="mb-8 text-center sm:text-left space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        {STEPS[currentStep].title}
                    </h2>
                    <p className="text-base text-white/50 font-light">
                        {STEPS[currentStep].subtitle}
                    </p>
                </div>

                <div className="min-h-[300px] sm:min-h-[380px] flex flex-col justify-center relative z-10">
                    <AnimatePresence mode="wait" initial={false} custom={stepDirection}>
                        <motion.div
                            key={currentStep}
                            custom={stepDirection}
                            initial={{
                                opacity: 0,
                                x: reduceMotion ? 0 : stepDirection > 0 ? 28 : -28,
                            }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{
                                opacity: 0,
                                x: reduceMotion ? 0 : stepDirection > 0 ? -20 : 20,
                            }}
                            transition={{
                                duration: reduceMotion ? 0.08 : 0.24,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="w-full"
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <WizardNavigation
                currentStep={currentStep}
                isSubmitting={isSubmitting}
                onNext={handleNext}
                onBack={handleBackWithDirection}
                canGoNext={canGoNext}
                nextLabel={nextLabel}
            />
        </div>
    );
}
