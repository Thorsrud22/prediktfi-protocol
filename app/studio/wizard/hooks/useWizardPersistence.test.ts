import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { safeGetItem, safeRemoveItem, safeSetItem } from '@/lib/safePersistence';
import { STEPS, WIZARD_CONSTANTS } from '../constants';
import { WizardFormData } from '../types';
import { useWizardPersistence } from './useWizardPersistence';

vi.mock('@/lib/safePersistence', () => ({
    safeGetItem: vi.fn(),
    safeSetItem: vi.fn(),
    safeRemoveItem: vi.fn(),
}));

const mockedSafeGetItem = vi.mocked(safeGetItem);
const mockedSafeSetItem = vi.mocked(safeSetItem);
const mockedSafeRemoveItem = vi.mocked(safeRemoveItem);

function buildFormData(overrides?: Partial<WizardFormData>): WizardFormData {
    return {
        projectType: 'ai',
        name: '',
        description: '',
        website: '',
        memecoinVibe: '',
        memecoinNarrative: '',
        defiMechanism: '',
        defiRevenue: '',
        aiModelType: '',
        aiDataMoat: '',
        nftUtility: '',
        nftCollectorHook: '',
        gamingCoreLoop: '',
        gamingEconomyModel: '',
        otherTargetUser: '',
        otherDifferentiation: '',
        teamSize: 'solo',
        successDefinition: '',
        ...overrides,
    };
}

describe('useWizardPersistence', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockedSafeGetItem.mockReset();
        mockedSafeSetItem.mockReset();
        mockedSafeRemoveItem.mockReset();
        mockedSafeGetItem.mockReturnValue(null);
        mockedSafeSetItem.mockReturnValue(true);
    });

    afterEach(() => {
        act(() => {
            vi.runOnlyPendingTimers();
        });
        vi.useRealTimers();
    });

    it('hydrates once even if callback identities change', async () => {
        mockedSafeGetItem.mockReturnValue(JSON.stringify({
            data: { projectType: 'ai', name: 'Restored', description: 'Saved draft' },
            step: 999,
        }));

        const hydrateFormA = vi.fn();
        const setCurrentStepA = vi.fn();
        const formData = buildFormData();

        const { result, rerender } = renderHook(
            ({ hydrateForm, setCurrentStep }) =>
                useWizardPersistence(formData, 0, hydrateForm, setCurrentStep),
            {
                initialProps: {
                    hydrateForm: hydrateFormA,
                    setCurrentStep: setCurrentStepA,
                },
            }
        );
        await act(async () => {});

        expect(result.current.isLoaded).toBe(true);

        expect(mockedSafeGetItem).toHaveBeenCalledTimes(1);
        expect(hydrateFormA).toHaveBeenCalledTimes(1);
        expect(setCurrentStepA).toHaveBeenCalledWith(STEPS.length - 1);

        const hydrateFormB = vi.fn();
        const setCurrentStepB = vi.fn();
        rerender({ hydrateForm: hydrateFormB, setCurrentStep: setCurrentStepB });

        expect(mockedSafeGetItem).toHaveBeenCalledTimes(1);
        expect(hydrateFormB).not.toHaveBeenCalled();
        expect(setCurrentStepB).not.toHaveBeenCalled();
    });

    it('does not show saved message when safeSetItem fails', async () => {
        mockedSafeSetItem.mockReturnValue(false);

        const { result } = renderHook(() =>
            useWizardPersistence(buildFormData(), 0, vi.fn(), vi.fn())
        );
        await act(async () => {});

        expect(result.current.isLoaded).toBe(true);

        act(() => {
            vi.advanceTimersByTime(WIZARD_CONSTANTS.DEBOUNCE_MS);
        });

        expect(mockedSafeSetItem).toHaveBeenCalledTimes(1);
        expect(result.current.showSavedMsg).toBe(false);
    });

    it('restarts hide timer when a second save occurs while message is visible', async () => {
        const hydrateForm = vi.fn();
        const setCurrentStep = vi.fn();
        const halfSavedDuration = Math.floor(WIZARD_CONSTANTS.SAVED_MSG_DURATION / 2);

        const { result, rerender } = renderHook(
            ({ formData }) => useWizardPersistence(formData, 0, hydrateForm, setCurrentStep),
            { initialProps: { formData: buildFormData({ description: 'first' }) } }
        );
        await act(async () => {});

        expect(result.current.isLoaded).toBe(true);

        // First save turns on the message.
        act(() => {
            vi.advanceTimersByTime(WIZARD_CONSTANTS.DEBOUNCE_MS);
        });
        expect(result.current.showSavedMsg).toBe(true);
        expect(mockedSafeSetItem).toHaveBeenCalledTimes(1);

        // Advance partway through visibility, then trigger another save.
        act(() => {
            vi.advanceTimersByTime(halfSavedDuration);
        });

        rerender({ formData: buildFormData({ description: 'second' }) });

        act(() => {
            vi.advanceTimersByTime(WIZARD_CONSTANTS.DEBOUNCE_MS);
        });
        expect(mockedSafeSetItem).toHaveBeenCalledTimes(2);
        expect(result.current.showSavedMsg).toBe(true);

        // Move past where the first hide would have fired; message should still be visible.
        const remainingUntilFirstHide = Math.max(
            WIZARD_CONSTANTS.SAVED_MSG_DURATION - (WIZARD_CONSTANTS.DEBOUNCE_MS + halfSavedDuration),
            0
        );
        act(() => {
            vi.advanceTimersByTime(remainingUntilFirstHide + 1);
        });
        expect(result.current.showSavedMsg).toBe(true);

        // Then message should hide after the restarted timer window.
        act(() => {
            vi.advanceTimersByTime(WIZARD_CONSTANTS.SAVED_MSG_DURATION);
        });
        expect(result.current.showSavedMsg).toBe(false);
    });

    it('clears storage and blocks subsequent saves in the session', async () => {
        const { result, rerender } = renderHook(
            ({ formData }) => useWizardPersistence(formData, 0, vi.fn(), vi.fn()),
            { initialProps: { formData: buildFormData({ description: 'before-clear' }) } }
        );
        await act(async () => {});

        expect(result.current.isLoaded).toBe(true);

        act(() => {
            result.current.clearStorage();
        });

        expect(mockedSafeRemoveItem).toHaveBeenCalledTimes(1);

        rerender({ formData: buildFormData({ description: 'after-clear' }) });

        act(() => {
            vi.advanceTimersByTime(WIZARD_CONSTANTS.DEBOUNCE_MS);
        });

        expect(mockedSafeSetItem).not.toHaveBeenCalled();
    });
});
