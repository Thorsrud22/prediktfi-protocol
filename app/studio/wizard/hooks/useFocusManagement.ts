import { useRef, useEffect, useCallback } from 'react';
import { WIZARD_CONSTANTS } from '../constants';

export function useFocusManagement(currentStep: number) {
    const focusRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Refs for the inputs we want to focus
    const nameInputRef = useRef<HTMLInputElement>(null);
    const descInputRef = useRef<HTMLTextAreaElement>(null);

    const clearPendingFocusRetry = useCallback(() => {
        if (focusRetryTimeoutRef.current) {
            clearTimeout(focusRetryTimeoutRef.current);
            focusRetryTimeoutRef.current = null;
        }
    }, []);

    const focusWithRetry = useCallback((getElement: () => HTMLInputElement | HTMLTextAreaElement | null, retries = WIZARD_CONSTANTS.FOCUS_RETRIES) => {
        clearPendingFocusRetry();

        const tryFocus = (remainingRetries: number) => {
            const element = getElement();
            if (!element) {
                if (remainingRetries > 0) {
                    focusRetryTimeoutRef.current = setTimeout(() => tryFocus(remainingRetries - 1), WIZARD_CONSTANTS.FOCUS_RETRY_DELAY_MS);
                }
                return;
            }

            element.focus();
            if (document.activeElement === element || remainingRetries <= 0) {
                return;
            }

            focusRetryTimeoutRef.current = setTimeout(() => tryFocus(remainingRetries - 1), WIZARD_CONSTANTS.FOCUS_RETRY_DELAY_MS);
        };

        tryFocus(retries);
    }, [clearPendingFocusRetry]);

    // Scroll and Focus logic
    useEffect(() => {
        // Scroll to top
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }, WIZARD_CONSTANTS.SCROLL_DELAY_MS);

        // Focus
        if (currentStep === 1) {
            focusWithRetry(() => nameInputRef.current);
        } else if (currentStep === 2) {
            focusWithRetry(() => descInputRef.current);
        } else {
            clearPendingFocusRetry();
        }

        return () => {
            clearPendingFocusRetry();
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, [currentStep, focusWithRetry, clearPendingFocusRetry]);

    return {
        nameInputRef,
        descInputRef
    };
}
