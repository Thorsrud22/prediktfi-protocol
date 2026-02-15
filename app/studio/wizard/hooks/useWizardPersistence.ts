import { useState, useEffect, useRef } from 'react';
import { WizardFormData } from '../types';
import { normalizeIdeaProjectType } from '@/lib/ideaCategories';
import { safeGetItem, safeSetItem, safeRemoveItem } from '@/lib/safePersistence';
import { WIZARD_CONSTANTS, STEPS } from '../constants';

const STORAGE_KEY = 'predikt_studio_draft';

export function useWizardPersistence(
    formData: WizardFormData,
    currentStep: number,
    hydrateForm: (data?: Partial<WizardFormData>) => void,
    setCurrentStep: (step: number) => void
) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [showSavedMsg, setShowSavedMsg] = useState(false);
    const [saveTick, setSaveTick] = useState(0);
    const submittedRef = useRef(false);
    const hydratedRef = useRef(false);

    // Hydrate from localStorage on mount
    useEffect(() => {
        if (hydratedRef.current) return;
        hydratedRef.current = true;

        try {
            const saved = safeGetItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const data = parsed.data || parsed;
                const step = parsed.step;

                if (data && typeof data === 'object') {
                    const candidate = data as Partial<WizardFormData>;
                    const normalizedType =
                        typeof candidate.projectType === 'string'
                            ? normalizeIdeaProjectType(candidate.projectType)
                            : null;
                    hydrateForm({ ...candidate, projectType: normalizedType });
                }

                if (typeof step === 'number' && Number.isFinite(step)) {
                    const clampedStep = Math.min(Math.max(Math.trunc(step), 0), STEPS.length - 1);
                    setCurrentStep(clampedStep);
                }
            }
        } catch (e) {
            console.error('Failed to hydrate saved draft', e);
        } finally {
            setIsLoaded(true);
        }
    }, [hydrateForm, setCurrentStep]);

    // Save to localStorage on change - DEBOUNCED
    useEffect(() => {
        if (!isLoaded || submittedRef.current) return;

        const timer = setTimeout(() => {
            if (submittedRef.current) return;

            const didSave = safeSetItem(STORAGE_KEY, JSON.stringify({ data: formData, step: currentStep }));
            if (didSave) {
                setShowSavedMsg(true);
                setSaveTick((tick) => tick + 1);
            }
        }, WIZARD_CONSTANTS.DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [formData, currentStep, isLoaded]);

    useEffect(() => {
        if (!showSavedMsg || saveTick === 0) return;

        const hideTimer = setTimeout(() => {
            setShowSavedMsg(false);
        }, WIZARD_CONSTANTS.SAVED_MSG_DURATION);

        return () => clearTimeout(hideTimer);
    }, [saveTick, showSavedMsg]);

    const clearStorage = () => {
        submittedRef.current = true;
        safeRemoveItem(STORAGE_KEY);
    };

    return {
        isLoaded,
        showSavedMsg,
        clearStorage
    };
}
