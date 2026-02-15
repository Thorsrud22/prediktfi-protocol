import { useRef, useEffect, useCallback } from 'react';
import { WIZARD_CONSTANTS, STEP_INDEX } from '../constants';

export function useFocusManagement(currentStep: number) {
    const focusRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                } else if (process.env.NODE_ENV === 'development') {
                    console.warn('[useFocusManagement] Focus retries exhausted - target element never appeared in DOM.');
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

    useEffect(() => {
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        // Brief delay allows step-transition animations to settle before scrolling,
        // preventing scroll-position conflicts with in-progress layout shifts.
        scrollTimeoutRef.current = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }, WIZARD_CONSTANTS.SCROLL_DELAY_MS);

        if (currentStep === STEP_INDEX.DETAILS) {
            focusWithRetry(() => nameInputRef.current);
        } else if (currentStep === STEP_INDEX.PITCH) {
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
