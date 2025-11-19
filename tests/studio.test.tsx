import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import StudioPage from '../app/studio/page';

// Mock the wallet provider
vi.mock('@/app/components/wallet/SimplifiedWalletProvider', () => ({
    useSimplifiedWallet: () => ({
        isConnected: false,
        publicKey: null,
        connect: vi.fn(),
    }),
}));

// Mock performance tracking
vi.mock('@/app/utils/performance', () => ({
    usePerformanceTracking: vi.fn(),
    trackPageLoad: vi.fn(() => ({ end: vi.fn() })),
}));

// Mock PerformanceMonitor component
vi.mock('../app/components/PerformanceMonitor', () => ({
    default: function MockPerformanceMonitor() {
        return <div data-testid="performance-monitor" />;
    },
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('AI Idea Evaluator Studio', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the landing view initially', () => {
        render(<StudioPage />);

        expect(screen.getByText(/AI Idea Evaluator Studio/i)).toBeInTheDocument();
        expect(screen.getByText(/Validate your crypto, memecoin, or web3 project ideas instantly/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start new evaluation/i })).toBeInTheDocument();
    });

    it('switches to evaluation flow when CTA is clicked', () => {
        render(<StudioPage />);

        const ctaButton = screen.getByRole('button', { name: /Start new evaluation/i });
        fireEvent.click(ctaButton);

        expect(screen.getByText('Submit Your Idea')).toBeInTheDocument();
        expect(screen.getByText('Project Type')).toBeInTheDocument();
    });

    it('shows validation errors when submitting empty form', async () => {
        render(<StudioPage />);

        // Enter flow
        fireEvent.click(screen.getByRole('button', { name: /Start new evaluation/i }));

        // Submit empty form
        const submitButton = screen.getByRole('button', { name: /Evaluate Idea/i });
        fireEvent.click(submitButton);

        // Check for validation messages
        await waitFor(() => {
            expect(screen.getByText('Please select a project type')).toBeInTheDocument();
            expect(screen.getByText('Description must be at least 10 characters long')).toBeInTheDocument();
        });
    });

    it('submits successfully with valid data', async () => {
        // Mock successful API response
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                evaluationId: 'eval_123',
                overallVerdict: 'Great idea',
                successProbability: 85,
                pros: ['Good market fit'],
                cons: ['High competition'],
                improvements: ['Add social features'],
                riskAnalysis: ['Regulatory risk'],
                confidenceScore: 0.9
            }),
        });

        render(<StudioPage />);

        // Enter flow
        fireEvent.click(screen.getByRole('button', { name: /Start new evaluation/i }));

        // Fill form
        fireEvent.click(screen.getByText('Defi')); // Project Type

        const descriptionInput = screen.getByPlaceholderText('Describe your project in a few sentences...');
        fireEvent.change(descriptionInput, { target: { value: 'A decentralized exchange for memecoins on Solana' } });

        fireEvent.click(screen.getByLabelText('2-5 Members')); // Team Size

        fireEvent.click(screen.getByText('Time')); // Resources
        fireEvent.click(screen.getByText('Skills'));

        const successInput = screen.getByPlaceholderText('e.g., 10k users, $1M TVL, mainnet launch...');
        fireEvent.change(successInput, { target: { value: '1M TVL' } });

        fireEvent.click(screen.getByText('Short Verdict')); // Response Style

        // Submit
        const submitButton = screen.getByRole('button', { name: /Evaluate Idea/i });
        fireEvent.click(submitButton);

        // Expect loading state
        expect(screen.getByText('Submitting...')).toBeInTheDocument();

        // Verify fetch was called
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Wait for report step
        await waitFor(() => {
            expect(screen.getByText('Evaluation Result')).toBeInTheDocument();
            expect(screen.getByText('Great idea')).toBeInTheDocument();
            expect(screen.getByText('85%')).toBeInTheDocument();
            expect(screen.getByText('Good market fit')).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});
