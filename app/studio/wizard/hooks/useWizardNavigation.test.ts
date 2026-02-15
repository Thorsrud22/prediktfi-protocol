import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCategoryContextualFields } from '@/lib/ideaCategories';
import { STEP_INDEX } from '../constants';
import { useWizardNavigation } from './useWizardNavigation';

vi.mock('@/lib/ideaCategories', () => ({
    getCategoryContextualFields: vi.fn(),
}));

const mockedGetCategoryContextualFields = vi.mocked(getCategoryContextualFields);

describe('useWizardNavigation', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockedGetCategoryContextualFields.mockReset();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('skips insights when moving forward with no contextual fields', () => {
        mockedGetCategoryContextualFields.mockReturnValue([]);

        const { result } = renderHook(() => useWizardNavigation('ai'));

        act(() => {
            result.current.setCurrentStep(STEP_INDEX.PITCH);
        });
        expect(result.current.currentStep).toBe(STEP_INDEX.PITCH);

        act(() => {
            result.current.handleNext();
        });

        expect(result.current.currentStep).toBe(STEP_INDEX.REVIEW);
    });

    it('skips insights when moving backward with no contextual fields', () => {
        mockedGetCategoryContextualFields.mockReturnValue([]);

        const { result } = renderHook(() => useWizardNavigation('ai'));

        act(() => {
            result.current.setCurrentStep(STEP_INDEX.REVIEW);
        });
        expect(result.current.currentStep).toBe(STEP_INDEX.REVIEW);

        act(() => {
            result.current.handleBack();
        });

        expect(result.current.currentStep).toBe(STEP_INDEX.PITCH);
    });

    it('resolves direct step jumps away from skipped insights', () => {
        mockedGetCategoryContextualFields.mockReturnValue([]);

        const { result } = renderHook(() => useWizardNavigation('ai'));

        act(() => {
            result.current.setCurrentStep(STEP_INDEX.INSIGHTS);
        });

        expect(result.current.currentStep).toBe(STEP_INDEX.REVIEW);
    });

    it('does not skip insights when contextual fields exist', () => {
        mockedGetCategoryContextualFields.mockReturnValue([
            {
                key: 'aiModelType',
                label: 'Model Type',
                reviewLabel: 'Model',
                placeholder: 'Type',
            },
        ]);

        const { result } = renderHook(() => useWizardNavigation('ai'));

        act(() => {
            result.current.setCurrentStep(STEP_INDEX.PITCH);
        });
        expect(result.current.currentStep).toBe(STEP_INDEX.PITCH);

        act(() => {
            result.current.handleNext();
        });

        expect(result.current.currentStep).toBe(STEP_INDEX.INSIGHTS);
    });
});
