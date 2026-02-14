import { useState, useCallback, useRef } from 'react';
import { ProjectType } from '../types';
import { STEPS, WIZARD_CONSTANTS } from '../constants';
import { getCategoryContextualFields } from '@/lib/ideaCategories';

export function useWizardNavigation(projectType: ProjectType) {
    const [currentStep, setCurrentStep] = useState(0);
    const isNavigatingRef = useRef(false);
    const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const hasContextualFields = useCallback((type: ProjectType) => {
        return getCategoryContextualFields(type).length > 0;
    }, []);

    const goToStep = useCallback((stepIndex: number) => {
        const clamped = Math.max(0, Math.min(stepIndex, STEPS.length - 1));
        setCurrentStep(clamped);
    }, []);

    const handleNext = useCallback(() => {
        if (isNavigatingRef.current) return;

        if (currentStep < STEPS.length - 1) {
            isNavigatingRef.current = true;

            // Skip insights step if no contextual fields for sector
            let targetStep = currentStep + 1;
            if (STEPS[targetStep].id === 'insights' && !hasContextualFields(projectType)) {
                targetStep += 1;
            }

            setCurrentStep(targetStep);

            // Cooldown
            if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
            navigationTimeoutRef.current = setTimeout(() => {
                isNavigatingRef.current = false;
            }, WIZARD_CONSTANTS.NAV_COOLDOWN_MS);
        }
    }, [currentStep, projectType, hasContextualFields]);

    const handleBack = useCallback(() => {
        if (isNavigatingRef.current || currentStep === 0) return;

        isNavigatingRef.current = true;

        // Skip insights step if no contextual fields for sector
        let targetStep = currentStep - 1;
        if (STEPS[targetStep].id === 'insights' && !hasContextualFields(projectType)) {
            targetStep -= 1;
        }

        setCurrentStep(targetStep);

        // Cooldown
        if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = setTimeout(() => {
            isNavigatingRef.current = false;
        }, WIZARD_CONSTANTS.NAV_COOLDOWN_MS);
    }, [currentStep, projectType, hasContextualFields]);

    return {
        currentStep,
        setCurrentStep: goToStep,
        handleNext,
        handleBack,
        isNavigatingRef,
        STEPS
    };
}
