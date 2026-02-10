import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import IdeaSubmissionWizard from '../app/studio/IdeaSubmissionWizard';

// Mock scrollTo and scrollIntoView
window.scrollTo = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('IdeaSubmissionWizard Validation Hardening', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    // Helper to wait for state to settle in tests (matches studio.test.tsx)
    const settle = () => new Promise(r => setTimeout(r, 100));

    const goToStep1 = async () => {
        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);
        fireEvent.click(screen.getByText('Memecoin'));
        await settle();
    };

    const goToStep2 = async () => {
        await goToStep1();
        const input = screen.getByPlaceholderText(/\$TICKER|Project Name/i);
        fireEvent.change(input, { target: { value: 'VALID NAME' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();
    };

    it('rejects name shorter than 3 characters with error message', async () => {
        await goToStep1();
        const input = screen.getByPlaceholderText(/\$TICKER|Project Name/i);

        fireEvent.change(input, { target: { value: 'A' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        expect(await screen.findByText(/Name must be at least 3 characters/i)).toBeInTheDocument();
        expect(screen.queryByText('The Pitch')).not.toBeInTheDocument();
    });

    it('rejects space-only name with error message', async () => {
        await goToStep1();
        const input = screen.getByPlaceholderText(/\$TICKER|Project Name/i);

        fireEvent.change(input, { target: { value: '   ' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        expect(await screen.findByText(/Name is required/i)).toBeInTheDocument();
    });

    it('passes name with 3 characters', async () => {
        await goToStep1();
        const input = screen.getByPlaceholderText(/\$TICKER|Project Name/i);

        fireEvent.change(input, { target: { value: 'ABC' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        expect(await screen.findByText(/The Pitch/i)).toBeInTheDocument();
    });

    it('rejects pitch with less than 10 meaningful characters', async () => {
        await goToStep2();
        const textarea = screen.getByPlaceholderText(/Explain|Describe/i);

        fireEvent.change(textarea, { target: { value: '123456789' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        expect(await screen.findByText(/Pitch must be at least 10 non-space characters/i)).toBeInTheDocument();
    });

    it('rejects pitch with 10 spaces', async () => {
        await goToStep2();
        const textarea = screen.getByPlaceholderText(/Explain|Describe/i);

        fireEvent.change(textarea, { target: { value: '          ' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        expect(await screen.findByText(/Pitch is required/i)).toBeInTheDocument();
    });

    it('passes pitch with 10 non-space characters', async () => {
        await goToStep2();
        const textarea = screen.getByPlaceholderText(/Explain|Describe/i);

        fireEvent.change(textarea, { target: { value: '1234567890' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        expect(await screen.findByText(/Strategic Insights/i)).toBeInTheDocument();
    });

    it('clears error messages when user starts typing', async () => {
        await goToStep1();
        const input = screen.getByPlaceholderText(/\$TICKER|Project Name/i);

        fireEvent.change(input, { target: { value: 'A' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        expect(await screen.findByText(/Name must be at least 3 characters/i)).toBeInTheDocument();

        fireEvent.change(input, { target: { value: 'AB' } });
        await settle();
        expect(screen.queryByText(/Name must be at least 3 characters/i)).not.toBeInTheDocument();
    });
});
