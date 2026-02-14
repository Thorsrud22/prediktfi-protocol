import { useState, useEffect, useRef } from 'react';
import { WizardFormData } from '../types';
import { normalizeIdeaProjectType } from '@/lib/ideaCategories';
import { WIZARD_CONSTANTS, STEPS } from '../constants';

const STORAGE_KEY = 'predikt_studio_draft';

export function useWizardPersistence(
    formData: WizardFormData,
    currentStep: number,
    setFormData: (data: WizardFormData) => void,
    setCurrentStep: (step: number) => void
) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [showSavedMsg, setShowSavedMsg] = useState(false);
    const submittedRef = useRef(false);

    // Hydrate from localStorage on mount
    useEffect(() => {
        setIsLoaded(true);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const data = parsed.data || parsed;
                const step = parsed.step;

                if (data && typeof data === 'object') {
                    // Type safety dance for projectType
                    const normalizedType = normalizeIdeaProjectType((data as Partial<WizardFormData>).projectType as any);
                    setFormData({ ...data, projectType: normalizedType } as WizardFormData);
                }

                if (typeof step === 'number' && Number.isFinite(step)) {
                    const clampedStep = Math.min(Math.max(Math.trunc(step), 0), STEPS.length - 1);
                    setCurrentStep(clampedStep);
                }
            } catch (e) {
                console.error("Failed to parse saved draft", e);
            }
        }
    }, [setFormData, setCurrentStep]);

    // Save to localStorage on change - DEBOUNCED
    useEffect(() => {
        if (!isLoaded || submittedRef.current) return;

        const timer = setTimeout(() => {
            if (submittedRef.current) return;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: formData, step: currentStep }));
            setShowSavedMsg(true);
            setTimeout(() => setShowSavedMsg(false), WIZARD_CONSTANTS.SAVED_MSG_DURATION);
        }, WIZARD_CONSTANTS.DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [formData, currentStep, isLoaded]);

    const clearStorage = () => {
        submittedRef.current = true;
        localStorage.removeItem(STORAGE_KEY);
    };

    return {
        isLoaded,
        showSavedMsg,
        clearStorage
    };
}
