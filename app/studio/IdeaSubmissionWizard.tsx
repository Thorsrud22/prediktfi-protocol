'use client';

import React, { useEffect } from 'react';
import { useWizardState } from './wizard/hooks/useWizardState';
import { useWizardNavigation } from './wizard/hooks/useWizardNavigation';
import { useWizardPersistence } from './wizard/hooks/useWizardPersistence';
import { useFocusManagement } from './wizard/hooks/useFocusManagement';
import { WIZARD_CONSTANTS, STEPS } from './wizard/constants';
import { WizardFormData } from './wizard/types';

// Components
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

// Validations helper should be at module scope
const getMeaningfulLength = (text: string) => text.replace(/\s/g, '').length;

export default function IdeaSubmissionWizard({ onSubmit, initialData, isSubmitting }: IdeaSubmissionWizardProps) {
    // 1. Logic Hooks
    const {
        formData,
        formDataRef, // Needed for global keydown listener
        errors,
        setErrors,
        updateField,
        setFormData
    } = useWizardState(initialData);

    const {
        currentStep,
        setCurrentStep,
        handleNext: navigateNext,
        handleBack
    } = useWizardNavigation(formData.projectType);

    const {
        isLoaded,
        showSavedMsg,
        clearStorage
    } = useWizardPersistence(formData, currentStep, setFormData, setCurrentStep);

    const { nameInputRef, descInputRef } = useFocusManagement(currentStep);

    // 2. Submission Logic
    const finalizeSubmission = (submission?: WizardFormData) => {
        clearStorage();
        onSubmit(submission || formDataRef.current);
    };

    // 3. Validation & Navigation Wrapper
    const handleNext = () => {
        const dataToValidate = formDataRef.current; // Use latest ref for synchronous validation

        if (currentStep === 0 && !dataToValidate.projectType) {
            setErrors({ name: 'Please select a sector' });
            return;
        }

        if (currentStep === 1) {
            const trimmedName = dataToValidate.name.trim();
            if (trimmedName.length < WIZARD_CONSTANTS.MIN_NAME_LENGTH) {
                setErrors({ name: trimmedName.length === 0 ? "Name is required" : `Name must be at least ${WIZARD_CONSTANTS.MIN_NAME_LENGTH} characters` });
                return;
            }
        }

        if (currentStep === 2) {
            const meaningfulLength = getMeaningfulLength(dataToValidate.description);
            if (meaningfulLength < WIZARD_CONSTANTS.MIN_PITCH_CHARS) {
                setErrors({ description: meaningfulLength === 0 ? "Pitch is required" : `Pitch must be at least ${WIZARD_CONSTANTS.MIN_PITCH_CHARS} non-space characters` });
                return;
            }
        }

        if (currentStep < STEPS.length - 1) {
            navigateNext();
        } else {
            finalizeSubmission(dataToValidate);
        }
    };

    // 4. Keyboard Handlers
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Command/Control + Enter logic for Step 2 (Multiline)
        if (currentStep === 2 && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            const meaningfulLength = getMeaningfulLength(formData.description);
            if (meaningfulLength < WIZARD_CONSTANTS.MIN_PITCH_CHARS) {
                setErrors({ description: meaningfulLength === 0 ? "Pitch is required" : `Pitch must be at least ${WIZARD_CONSTANTS.MIN_PITCH_CHARS} non-space characters` });
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

            e.preventDefault();
            handleNext();
        }
    };

    // Global Keydown for Power User "Cmd+Enter" Submit anywhere
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (currentStep === STEPS.length - 1) {
                    e.preventDefault();
                    finalizeSubmission(formDataRef.current);
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [currentStep]); // finalSubmission is stable if defined outside, but better to depend on minimal set

    // 5. Render Step Content
    if (!isLoaded) return null; // Avoid hydration mismatch

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <SectorStep formData={formData} updateField={updateField} errors={errors} />;
            case 1:
                return (
                    <IdentityStep
                        ref={nameInputRef}
                        formData={formData}
                        updateField={updateField}
                        errors={errors}
                        onKeyDown={handleKeyDown}
                    />
                );
            case 2:
                return (
                    <PitchStep
                        ref={descInputRef}
                        formData={formData}
                        updateField={updateField}
                        errors={errors}
                        onKeyDown={handleKeyDown}
                    />
                );
            case 3:
                return (
                    <ContextStep
                        formData={formData}
                        updateField={updateField}
                        onKeyDown={handleKeyDown}
                    />
                );
            case 4:
                return <ReviewStep formData={formData} />;
            default:
                return null;
        }
    };

    const canGoNext = !(currentStep === 0 && !formData.projectType);

    return (
        <div className="w-full max-w-4xl mx-auto min-h-[300px] flex flex-col relative px-4 sm:px-0 pb-20 sm:pb-0 scroll-mt-24 pt-0">
            <WizardProgress currentStep={currentStep} showSavedMsg={showSavedMsg} />

            <div className="relative mt-4">
                {/* Headers */}
                <div key={currentStep} className="mb-8 text-center sm:text-left space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                        {STEPS[currentStep].title}
                    </h2>
                    <p className="text-base text-white/50 font-light">
                        {STEPS[currentStep].subtitle}
                    </p>
                </div>

                {/* Step Content */}
                <div className="min-h-[300px] sm:min-h-[380px] flex flex-col justify-center relative z-10">
                    {renderStep()}
                </div>
            </div>

            <WizardNavigation
                currentStep={currentStep}
                projectType={formData.projectType}
                isSubmitting={!!isSubmitting} // Ensure boolean
                onNext={handleNext}
                onBack={handleBack}
                canGoNext={canGoNext}
            />
        </div>
    );
}
