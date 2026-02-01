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

// Mock the ideaSchema
vi.mock('@/lib/ideaSchema', async () => {
    const { z } = await import('zod');
    const schema = z.object({
        description: z.string().min(10, 'Description must be at least 10 characters long'),
        projectType: z.enum(['memecoin', 'defi', 'ai'], {
            errorMap: () => ({ message: 'Please select a project type' }),
        }),
        teamSize: z.string().optional().default('solo'),
        resources: z.array(z.string()).optional(),
        successDefinition: z.string().optional(),
        attachments: z.string().optional(),
        responseStyle: z.string().optional(),
        focusHints: z.array(z.string()).optional(),
        mvpScope: z.string().optional(),
        goToMarketPlan: z.string().optional(),
        launchLiquidityPlan: z.string().optional(),
        tokenAddress: z.string().optional(),
        memecoinVibe: z.string().optional(),
        defiMechanism: z.string().optional(),
        aiModelType: z.string().optional(),
        memecoinNarrative: z.string().optional(),
        defiRevenue: z.string().optional(),
        aiDataMoat: z.string().optional(),
        defiSecurityMarks: z.array(z.string()).optional(),
        memecoinLaunchPreparation: z.array(z.string()).optional(),
        aiInfraReadiness: z.array(z.string()).optional(),
        targetTVL: z.string().optional(),
        targetMarketCap: z.string().optional(),
        targetDAU: z.string().optional(),
    });
    return {
        ideaSubmissionSchema: schema,
        IdeaSubmission: {} as any,
    };
});

// Mock fetch for API calls
global.fetch = vi.fn();

describe('AI Idea Evaluator Studio', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.scrollTo = vi.fn();

        // Default mock for Quota calls
        (global.fetch as any).mockImplementation((url: string) => {
            if (url && url.toString().includes('/api/idea-evaluator/quota')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ limit: 3, remaining: 3, reset: Date.now() + 86400000 })
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        window.alert = vi.fn();
    });

    it('renders the single page form initially', () => {
        render(<StudioPage />);

        // Check for main headers
        expect(screen.getByText(/What are you building?/i)).toBeInTheDocument();
        expect(screen.getByText(/The Pitch/i)).toBeInTheDocument();

        // Check for project types
        expect(screen.getByText('Memecoin')).toBeInTheDocument();
        expect(screen.getByText('DeFi & Utility')).toBeInTheDocument();
        expect(screen.getByText('AI Agent')).toBeInTheDocument();

        // Check for submit button
        expect(screen.getByText('Initiate Protocol')).toBeInTheDocument();
    });

    it('shows validation errors when attempting to submit with empty form', async () => {
        render(<StudioPage />);

        // Click Run Analysis without filling anything
        fireEvent.click(screen.getByText('Initiate Protocol'));

        // Wait for validation error
        await waitFor(() => {
            expect(screen.getByText(/Please provide a more detailed description/i)).toBeInTheDocument();
        });
    });

    it('submits successfully with valid data', async () => {
        // Mock the streaming endpoint
        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes('/api/idea-evaluator/quota')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ limit: 3, remaining: 3, reset: Date.now() + 86400000 })
                });
            }
            if (url.includes('/api/idea-evaluator/evaluate-stream')) {
                const mockResult = {
                    overallScore: 85,
                    summary: {
                        title: 'Test Idea',
                        oneLiner: 'A test project',
                        mainVerdict: 'Good'
                    },
                    technical: { feasibilityScore: 80, keyRisks: [], requiredComponents: [], comments: '' },
                    tokenomics: { tokenNeeded: true, designScore: 80, mainIssues: [], suggestions: [] },
                    market: { marketFitScore: 80, targetAudience: [], competitorSignals: [], goToMarketRisks: [] },
                    execution: { complexityLevel: 'low', founderReadinessFlags: [], estimatedTimeline: '1m' },
                    recommendations: { mustFixBeforeBuild: [], recommendedPivots: [], niceToHaveLater: [] },
                    calibrationNotes: []
                };

                const sseData = [
                    'event: step\ndata: {"step":"Initializing..."}\n\n',
                    `event: complete\ndata: {"result":${JSON.stringify(mockResult)}}\n\n`
                ].join('');

                const encoder = new TextEncoder();
                const stream = new ReadableStream({
                    start(controller) {
                        controller.enqueue(encoder.encode(sseData));
                        controller.close();
                    }
                });

                return Promise.resolve({ ok: true, body: stream });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        render(<StudioPage />);

        // 1. Select Project Type (Memecoin)
        fireEvent.click(screen.getByText('Memecoin'));

        // 2. Fill Description
        const descriptionInput = screen.getByPlaceholderText(/A Solana memecoin/i);
        fireEvent.change(descriptionInput, { target: { value: 'This is a test memecoin description that is long enough.' } });

        // 3. Open Advanced Options
        fireEvent.click(screen.getByText('Advanced Configuration'));

        // 4. Check Advanced Field visibility
        await waitFor(() => {
            expect(screen.getByText('Team Size')).toBeInTheDocument();
        });

        // 5. Submit
        fireEvent.click(screen.getByText('Initiate Protocol'));

        // 6. Verify Terminal appears (now named "prediktfi — evaluation")
        await waitFor(() => {
            expect(screen.getByText(/prediktfi — evaluation/i)).toBeInTheDocument();
        });
    });

    it('toggles advanced options correctly', async () => {
        render(<StudioPage />);

        // Initially hidden
        expect(screen.queryByText('Team Size')).not.toBeInTheDocument();

        // Click to show
        fireEvent.click(screen.getByText('Advanced Configuration'));
        await waitFor(() => {
            expect(screen.getByText('Team Size')).toBeInTheDocument();
        });

        // Click to hide
        fireEvent.click(screen.getByText('Advanced Configuration'));
        await waitFor(() => {
            expect(screen.queryByText('Team Size')).not.toBeInTheDocument();
        });
    });
});
