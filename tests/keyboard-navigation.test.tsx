import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import IdeaSubmissionWizard from '../app/studio/IdeaSubmissionWizard';

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
    });

    afterEach(() => {
        cleanup();
    });

    // Helper to wait for state to settle in tests
    const settle = () => new Promise(r => setTimeout(r, 50));

    it('advances from Identity step with Enter', async () => {
        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        // Step 0: Select Memecoin to get to Step 1
        fireEvent.click(screen.getByText('Memecoin'));
        await settle();

        // Step 1: Project Identity
        expect(screen.getAllByText(/Project Identity/i).length).toBeGreaterThan(0);
        const nameInput = screen.getByLabelText(/Ticker Symbol/i);

        fireEvent.change(nameInput, { target: { value: 'TEST' } });
        fireEvent.keyDown(nameInput, { key: 'Enter', code: 'Enter' });
        await settle();

        // Should be at Step 2
        expect(screen.getAllByText(/The Pitch/i).length).toBeGreaterThan(0);
    });

    it('does NOT advance from Pitch step with Enter (adds newline instead)', async () => {
        render(<IdeaSubmissionWizard onSubmit={mockOnSubmit} />);

        // Select sector and name to get to Pitch step
        fireEvent.click(screen.getByText('Memecoin'));
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
        fireEvent.click(screen.getByText('Memecoin'));
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

        // Advance to Step 1
        fireEvent.click(screen.getByText('Memecoin'));
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
});
