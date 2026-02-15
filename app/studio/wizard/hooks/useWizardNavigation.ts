import { useState, useCallback, useEffect, useRef } from 'react';
import { ProjectType } from '../types';
import { STEPS, WIZARD_CONSTANTS } from '../constants';
import { getCategoryContextualFields } from '@/lib/ideaCategories';

function shouldSkipStep(stepIndex: number, projectType: ProjectType): boolean {
    const step = STEPS[stepIndex];
    return step?.id === 'insights' && getCategoryContextualFields(projectType).length === 0;
}

function resolveStep(from: number, direction: 1 | -1, projectType: ProjectType): number {
    let target = from + direction;
    // Bounds: > 0 / < length-1 ensures first and last steps are always reachable.
    // Revisit if those positions ever become skippable.
    while (target > 0 && target < STEPS.length - 1 && shouldSkipStep(target, projectType)) {
        target += direction;
    }

    return Math.max(0, Math.min(target, STEPS.length - 1));
}

export function useWizardNavigation(projectType: ProjectType) {
    const [currentStep, setCurrentStep] = useState(0);
    const isNavigatingRef = useRef(false);
    const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
            }
        };
    }, []);

    const navigateWithCooldown = useCallback((targetStep: number) => {
        setCurrentStep(targetStep);

        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
        }

        navigationTimeoutRef.current = setTimeout(() => {
            isNavigatingRef.current = false;
        }, WIZARD_CONSTANTS.NAV_COOLDOWN_MS);
    }, []);

    const goToStep = useCallback((stepIndex: number) => {
        const clamped = Math.max(0, Math.min(stepIndex, STEPS.length - 1));
        const resolved = shouldSkipStep(clamped, projectType)
            ? resolveStep(clamped - 1, 1, projectType)
            : clamped;
        setCurrentStep(resolved);
    }, [projectType]);

    const handleNext = useCallback(() => {
        if (isNavigatingRef.current || currentStep >= STEPS.length - 1) return;

        isNavigatingRef.current = true;
        navigateWithCooldown(resolveStep(currentStep, 1, projectType));
    }, [currentStep, navigateWithCooldown, projectType]);

    const handleBack = useCallback(() => {
        if (isNavigatingRef.current || currentStep === 0) return;

        isNavigatingRef.current = true;
        navigateWithCooldown(resolveStep(currentStep, -1, projectType));
    }, [currentStep, navigateWithCooldown, projectType]);

    return {
        currentStep,
        setCurrentStep: goToStep,
        handleNext,
        handleBack,
    };
}
