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

// Mock Aurora component
vi.mock('../app/components/ui/Aurora', () => ({
    default: function MockAurora() {
        return <div data-testid="aurora-background" />;
    },
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('AI Idea Evaluator Studio', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.scrollTo = vi.fn();

        // Default mock for Quota calls to avoid unhandled rejections in simple renders
        (global.fetch as any).mockImplementation((url: string) => {
            if (url && url.toString().includes('/api/idea-evaluator/quota')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ limit: 3, remaining: 3, reset: Date.now() + 86400000 })
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
    });

    it('submits successfully with valid data through wizard steps', async () => {
        // Mock API responses based on URL
        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes('/api/idea-evaluator/quota')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ limit: 3, remaining: 3, reset: Date.now() + 86400000 })
                });
            }
            if (url.includes('/api/idea-evaluator/evaluate')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        result: {
                            overallScore: 85,
                            summary: {
                                title: 'Great Idea Title',
                                oneLiner: 'A decentralized exchange for memecoins',
                                mainVerdict: 'Great idea with potential'
                            },
                            technical: {
                                feasibilityScore: 90,
                                keyRisks: ['Smart contract risk'],
                                requiredComponents: ['Solana Program'],
                                comments: 'Technically sound'
                            },
                            tokenomics: {
                                tokenNeeded: true,
                                designScore: 70,
                                mainIssues: [],
                                suggestions: []
                            },
                            market: {
                                marketFitScore: 80,
                                targetAudience: ['Degens'],
                                competitorSignals: [],
                                goToMarketRisks: ['High competition']
                            },
                            execution: {
                                complexityLevel: 'medium',
                                founderReadinessFlags: [],
                                estimatedTimeline: '3 months'
                            },
                            recommendations: {
                                mustFixBeforeBuild: [],
                                recommendedPivots: ['Add social features'],
                                niceToHaveLater: []
                            },
                            calibrationNotes: ['DeFi: plus points for explicit audit/security thinking and a concrete target user.']
                        }
                    }),
                });
            }
            return Promise.reject(new Error(`Unknown URL: ${url}`));
        });

        render(<StudioPage />);

        // Expect form to be immediately visible
        await waitFor(() => {
            expect(screen.getByText('The Vision')).toBeInTheDocument();
        }, { timeout: 2000 });

        // --- STEP 1: VISION ---
        fireEvent.click(screen.getByText('DeFi')); // Project Type
        const descriptionInput = screen.getByPlaceholderText('Describe your project in a few sentences... What problem does it solve?');
        fireEvent.change(descriptionInput, { target: { value: 'A decentralized exchange for memecoins on Solana' } });

        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

        // --- STEP 2: EXECUTION ---
        await waitFor(() => expect(screen.getByText('Execution')).toBeInTheDocument());

        // Use getByRole for accurate button selection including the label text
        fireEvent.click(screen.getByText('2-5 Members'));

        // Wait for animation frame or just robustness
        await waitFor(() => expect(screen.getByText('Audit Planned / Completed')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Audit Planned / Completed'));
        fireEvent.click(screen.getByText('Multisig / DAO Setup'));

        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

        // --- STEP 3: STRATEGY ---
        await waitFor(() => expect(screen.getByText('Strategy')).toBeInTheDocument());

        // These fields are optional/text areas in the new form
        const mvpInput = screen.getByPlaceholderText('What is the realistic MVP you can ship?');
        fireEvent.change(mvpInput, { target: { value: 'Basic AMM' } });

        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

        // --- STEP 4: GOALS ---
        await waitFor(() => expect(screen.getByText('Goals')).toBeInTheDocument());

        const successInput = screen.getByPlaceholderText('e.g. $1M TVL');
        fireEvent.change(successInput, { target: { value: '1M TVL' } });

        fireEvent.click(screen.getByText('Short Verdict')); // Response Style

        // Submit
        const submitButton = screen.getByRole('button', { name: /Run Evaluation/i });
        fireEvent.click(submitButton);

        // Expect loading state from the overlay, not the form button
        // The form unmounts or is covered by EvaluationLoadingOverlay which says "Parsing your idea..."
        expect(screen.getByText(/Parsing your idea/i)).toBeInTheDocument();

        // Verify fetch was called
        // Verify fetch was called at least once (quota + evaluate)
        expect(global.fetch).toHaveBeenCalled();

        // Wait for report step
        await waitFor(() => {
            expect(screen.getByText('Great Idea Title')).toBeInTheDocument();
            expect(screen.getByText('85')).toBeInTheDocument();
            expect(screen.getByText('Technically sound')).toBeInTheDocument();
            expect(screen.getByText('High competition')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('shows smart conditional fields based on project type', async () => {
        render(<StudioPage />);

        // Immediate check
        expect(screen.getByText('The Vision')).toBeInTheDocument();

        // Select Memecoin -> Should show "Community Vibe"
        fireEvent.click(screen.getByText('Memecoin'));
        expect(screen.getByText('Community Vibe')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. PolitiFi, Cats, Retro...')).toBeInTheDocument();

        // Select DeFi -> Should show "Core Mechanism"
        fireEvent.click(screen.getByText('DeFi'));
        expect(screen.getByText('Core Mechanism')).toBeInTheDocument();
        expect(screen.getByText('Revenue Model')).toBeInTheDocument();

        // Ensure Memecoin fields are gone
        expect(screen.queryByText('Community Vibe')).not.toBeInTheDocument();
    });

    it('shows adaptive checklists and goals based on project type', async () => {
        render(<StudioPage />);

        // Start
        await waitFor(() => screen.getByText('The Vision'));

        // 1. MEMECOIN FLOW
        fireEvent.click(screen.getByText('Memecoin'));
        fireEvent.change(screen.getByPlaceholderText('Describe your project in a few sentences... What problem does it solve?'), { target: { value: 'A memecoin about coding.' } });

        // Next to Execution
        fireEvent.click(screen.getByText('Next Step'));
        await waitFor(() => screen.getByText('Execution'));

        // Check Memecoin Checklist
        expect(screen.getByText('KOLs / Influencers Lined Up')).toBeInTheDocument();
        expect(screen.queryByText('Audit Planned / Completed')).not.toBeInTheDocument();

        // Select Team Size (required)
        fireEvent.click(screen.getByLabelText(/Solo Builder/i));

        // Next to Strategy (skip)
        fireEvent.click(screen.getByText('Next Step'));
        await waitFor(() => screen.getByText('MVP Scope (6-12 months)'));

        // Fill MVP Scope (required)
        fireEvent.change(screen.getByPlaceholderText('What is the realistic MVP you can ship?'), { target: { value: 'A simple token launcher.' } });

        // Next to Goals
        fireEvent.click(screen.getByText('Next Step'));
        await waitFor(() => screen.getByText('Goals'));

        // Check Memecoin Goal
        expect(screen.getByText('Target Market Cap (3mo)')).toBeInTheDocument();
        expect(screen.queryByText('Target TVL / Volume')).not.toBeInTheDocument();
    });
});

