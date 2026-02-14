import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import IdeaSubmissionWizard from '../app/studio/IdeaSubmissionWizard';

const STORAGE_KEY = 'predikt_studio_draft';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    ArrowRight: () => <div data-testid="arrow-right-icon" />,
    Check: () => <div data-testid="check-icon" />,
    ChevronRight: () => <div data-testid="chevron-right-icon" />,
    Command: () => <div data-testid="command-icon" />,
    CornerDownLeft: () => <div data-testid="corner-down-left-icon" />,
    Sparkles: () => <div data-testid="sparkles-icon" />,
    Zap: () => <div data-testid="zap-icon" />,
    Globe: () => <div data-testid="globe-icon" />,
    Cpu: () => <div data-testid="cpu-icon" />,
    Palette: () => <div data-testid="palette-icon" />,
    Gamepad2: () => <div data-testid="gamepad2-icon" />,
    MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
    History: () => <div data-testid="history-icon" />,
}));

describe('IdeaSubmissionWizard Keyboard Navigation', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        window.scrollTo = vi.fn();
        localStorage.clear();
    });

    afterEach(() => {
        cleanup();
    });

    // Helper to wait for state to settle in tests
    const settle = () => new Promise(r => setTimeout(r, 50));

    const goToIdentityStep = async () => {
        fireEvent.click(screen.getByRole('button', { name: /Memecoin/i }));
        await settle();
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
        await settle();
        return screen.getByLabelText(/Ticker Symbol|Project Name/i) as HTMLInputElement;
    };

    it('auto-focuses the name input when entering Project Identity', async () => {
        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        const nameInput = await goToIdentityStep();
        await waitFor(() => {
            expect(nameInput).toHaveFocus();
        });
    });

    it('restores draft on step 1 and auto-focuses the name input', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            data: {
                projectType: 'memecoin',
                name: '',
                description: ''
            },
            step: 1
        }));

        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        const nameInput = await screen.findByLabelText(/Ticker Symbol|Project Name/i);
        await waitFor(() => {
            expect(nameInput).toHaveFocus();
        });
    });

    it('clamps invalid restored draft step to a valid wizard step', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            data: {
                projectType: 'memecoin',
                name: 'TEST',
                description: 'This is a valid description'
            },
            step: 99
        }));

        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        await waitFor(() => {
            expect(screen.getByText(/Ready to Launch\?/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/STEP 5 \/ 5/i)).toBeInTheDocument();
    });

    it('writes the first character immediately on the identity input', async () => {
        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        const nameInput = await goToIdentityStep();
        await waitFor(() => {
            expect(nameInput).toHaveFocus();
        });
        expect(nameInput).toHaveAttribute('placeholder', '$TICKER');

        fireEvent.change(nameInput, { target: { value: 'P' } });
        expect(nameInput).toHaveValue('P');
    });

    it('does not render a custom terminal cursor on identity input', async () => {
        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        const nameInput = await goToIdentityStep();
        await waitFor(() => {
            expect(nameInput).toHaveFocus();
        });
        expect(screen.queryByTestId('name-terminal-cursor')).not.toBeInTheDocument();

        fireEvent.blur(nameInput);
        await waitFor(() => {
            expect(screen.queryByTestId('name-terminal-cursor')).not.toBeInTheDocument();
        });

        fireEvent.focus(nameInput);
        await waitFor(() => {
            expect(screen.queryByTestId('name-terminal-cursor')).not.toBeInTheDocument();
        });
    });

    it('advances from Identity step with Enter', async () => {
        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        const continueBtn = screen.getByRole('button', { name: /Continue/i });
        expect(continueBtn).toBeDisabled();

        // Step 0 -> Step 1
        const nameInput = await goToIdentityStep();
        await waitFor(() => {
            expect(nameInput).toHaveFocus();
        });

        fireEvent.change(nameInput, { target: { value: 'TEST' } });
        fireEvent.keyDown(nameInput, { key: 'Enter', code: 'Enter' });
        await settle();

        // Should be at Step 2
        expect(screen.getAllByText(/The Pitch/i).length).toBeGreaterThan(0);
    });

    it('does NOT advance from Pitch step with Enter (adds newline instead)', async () => {
        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        // Select sector and name to get to Pitch step
        fireEvent.click(screen.getByRole('button', { name: /Memecoin/i }));
        await settle();
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
        await settle();
        fireEvent.change(screen.getByLabelText(/Ticker Symbol/i), { target: { value: 'TEST' } });
        fireEvent.keyDown(screen.getByLabelText(/Ticker Symbol/i), { key: 'Enter', code: 'Enter' });
        await settle();

        // Step 2: The Pitch
        expect(screen.getAllByText(/The Pitch/i).length).toBeGreaterThan(0);
        const pitchInput = screen.getByLabelText(/The Pitch/i);

        fireEvent.change(pitchInput, { target: { value: 'This is a test description.' } });
        fireEvent.keyDown(pitchInput, { key: 'Enter', code: 'Enter' });
        await settle();

        // Should STILL be at Step 2
        expect(screen.getAllByText(/The Pitch/i).length).toBeGreaterThan(0);
    });

    it('advances from Pitch step with Cmd+Enter', async () => {
        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        // Navigate to Pitch step
        fireEvent.click(screen.getByRole('button', { name: /Memecoin/i }));
        await settle();
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
        await settle();
        fireEvent.change(screen.getByLabelText(/Ticker Symbol/i), { target: { value: 'TEST' } });
        fireEvent.keyDown(screen.getByLabelText(/Ticker Symbol/i), { key: 'Enter', code: 'Enter' });
        await settle();

        // Step 2: The Pitch
        const pitchInput = screen.getByLabelText(/The Pitch/i);
        fireEvent.change(pitchInput, { target: { value: 'This is a test description that is valid.' } });

        // Cmd+Enter
        fireEvent.keyDown(pitchInput, { key: 'Enter', code: 'Enter', metaKey: true });
        await settle();

        // Should be at Step 3 (Strategic Insights) or Step 4 (Review) depending on sector
        expect(screen.getAllByText(/Strategic Insights|Ready to Launch?/i).length).toBeGreaterThan(0);
    });

    it('shows correct footer hints for each step', async () => {
        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        // Step 0 hints
        expect(screen.getByText('Click')).toBeInTheDocument();
        expect(screen.getByText('to select')).toBeInTheDocument();
        expect(screen.getByText('Enter')).toBeInTheDocument();
        expect(screen.getByText('to continue')).toBeInTheDocument();

        // Advance to Step 1
        fireEvent.click(screen.getByRole('button', { name: /Memecoin/i }));
        await settle();
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
        await settle();
        expect(screen.getByText('Enter')).toBeInTheDocument();
        expect(screen.getByText('to proceed')).toBeInTheDocument();

        // Advance to Step 2
        fireEvent.change(screen.getByLabelText(/Ticker Symbol/i), { target: { value: 'TEST' } });
        fireEvent.keyDown(screen.getByLabelText(/Ticker Symbol/i), { key: 'Enter', code: 'Enter' });
        await settle();
        expect(screen.getByText('Cmd + Enter')).toBeInTheDocument();
        expect(screen.getByText('to proceed')).toBeInTheDocument();
    });

    it('keeps selected sector when rerendered with unchanged initialData values', async () => {
        const { rerender } = render(
            <IdeaSubmissionWizard
                onSubmit={mockOnSubmit}
                initialData={{ projectType: null, name: '', description: '' }}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /AI Agent/i }));
        await settle();
        expect(screen.getByRole('button', { name: /AI Agent/i })).toHaveAttribute('aria-pressed', 'true');

        rerender(
            <IdeaSubmissionWizard
                onSubmit={mockOnSubmit}
                initialData={{ projectType: null, name: '', description: '' }}
            />
        );

        await settle();
        expect(screen.getByRole('button', { name: /AI Agent/i })).toHaveAttribute('aria-pressed', 'true');
    });

    it('clears draft on final-step keyboard submit (Cmd+Enter)', async () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            data: {
                projectType: 'memecoin',
                name: 'TEST',
                description: 'This is a valid description'
            },
            step: 4
        }));

        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Generate Report/i })).toBeInTheDocument();
        });

        fireEvent.keyDown(window, { key: 'Enter', code: 'Enter', metaKey: true });

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        });
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
});
