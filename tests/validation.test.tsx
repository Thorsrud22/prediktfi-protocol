import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import IdeaSubmissionWizard from '../app/studio/IdeaSubmissionWizard';

// Mock scrollTo and scrollIntoView
window.scrollTo = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock localStorage for test stability
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('IdeaSubmissionWizard Validation Hardening', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    // Helper to wait for state to settle in tests (matches studio.test.tsx)
    const settle = () => new Promise(r => setTimeout(r, 200));

    const goToStep1 = async () => {
        console.log('Rendering Wizard...');
        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);
        console.log('Waiting for Memecoin button...');
        const memecoinBtn = await screen.findByText(/Memecoin/i);
        console.log('Found Memecoin button, clicking...');
        fireEvent.click(memecoinBtn);
        await settle();
    };

    const goToStep2 = async () => {
        await goToStep1();
        const input = await screen.findByPlaceholderText(/\$TICKER|Project Name/i);
        fireEvent.change(input, { target: { value: 'VALID NAME' } });
        await settle();
        const continueBtn = await screen.findByText('Continue');
        fireEvent.click(continueBtn);
        await settle();
    };

    it('rejects name shorter than 3 characters with error message', async () => {
        await goToStep1();
        const input = await screen.findByPlaceholderText(/\$TICKER|Project Name/i);

        fireEvent.change(input, { target: { value: 'A' } });
        await settle();
        fireEvent.click(await screen.findByText(/Continue/i));
        await settle();

        expect(await screen.findByText(/Name must be at least 3 characters/i)).toBeInTheDocument();
        expect(screen.queryByText(/The Pitch/i)).not.toBeInTheDocument();
    });

    it('rejects space-only name with error message', async () => {
        await goToStep1();
        const input = await screen.findByPlaceholderText(/\$TICKER|Project Name/i);

        fireEvent.change(input, { target: { value: '   ' } });
        await settle();
        fireEvent.click(await screen.findByText(/Continue/i));
        await settle();

        expect(await screen.findByText(/Name is required/i)).toBeInTheDocument();
    });

    it('passes name with 3 characters', async () => {
        await goToStep1();
        const input = await screen.findByPlaceholderText(/\$TICKER|Project Name/i);

        fireEvent.change(input, { target: { value: 'ABC' } });
        await settle();
        fireEvent.click(await screen.findByText(/Continue/i));
        await settle();

        expect((await screen.findAllByText(/The Pitch/i)).length).toBeGreaterThan(0);
    });

    it('rejects pitch with less than 10 meaningful characters', async () => {
        await goToStep2();
        const textarea = await screen.findByPlaceholderText(/Explain|Describe/i);

        fireEvent.change(textarea, { target: { value: '123456789' } });
        await settle();
        fireEvent.click(await screen.findByText(/Continue/i));
        await settle();

        expect(await screen.findByText(/Pitch must be at least 10 non-space characters/i)).toBeInTheDocument();
    });

    it('rejects pitch with 10 spaces', async () => {
        await goToStep2();
        const textarea = await screen.findByPlaceholderText(/Explain|Describe/i);

        fireEvent.change(textarea, { target: { value: '          ' } });
        await settle();
        fireEvent.click(await screen.findByText(/Continue/i));
        await settle();

        expect(await screen.findByText(/Pitch is required/i)).toBeInTheDocument();
    });

    it('passes pitch with 10 non-space characters', async () => {
        await goToStep2();
        const textarea = await screen.findByPlaceholderText(/Explain|Describe/i);

        fireEvent.change(textarea, { target: { value: '1234567890' } });
        await settle();
        fireEvent.click(await screen.findByText(/Strategic Insights/i));
        await settle();

        expect(await screen.findByText(/Strategic Insights/i)).toBeInTheDocument();
    });

    it('clears error messages when user starts typing', async () => {
        await goToStep1();
        const input = await screen.findByPlaceholderText(/\$TICKER|Project Name/i);

        fireEvent.change(input, { target: { value: 'A' } });
        await settle();
        fireEvent.click(await screen.findByText(/Continue/i));
        await settle();

        expect(await screen.findByText(/Name must be at least 3 characters/i)).toBeInTheDocument();

        fireEvent.change(input, { target: { value: 'AB' } });
        await settle();
        expect(screen.queryByText(/Name must be at least 3 characters/i)).not.toBeInTheDocument();
    });
});
