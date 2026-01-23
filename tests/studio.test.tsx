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

// Mock the ideaSchema to ensure validation works correctly in tests
vi.mock('@/lib/ideaSchema', async () => {
    const { z } = await import('zod');
    const schema = z.object({
        description: z.string().min(10, 'Description must be at least 10 characters long'),
        projectType: z.enum(['memecoin', 'defi', 'nft', 'game', 'ai', 'other'], {
            errorMap: () => ({ message: 'Please select a project type' }),
        }),
        teamSize: z.enum(['solo', 'team_2_5', 'team_6_plus'], {
            errorMap: () => ({ message: 'Please select a team size' }),
        }),
        resources: z.array(z.string()).optional(),
        successDefinition: z.string().min(5, 'Please define what success means to you'),
        attachments: z.string().optional(),
        responseStyle: z.enum(['short', 'full', 'next_steps'], {
            errorMap: () => ({ message: 'Please select a response style' }),
        }),
        focusHints: z.array(z.string()).optional(),
        // Add new optional fields to match real schema to prevent "unrecognized key" stripping if z.strict() was used (it's not but safe practice)
        memecoinNarrative: z.string().optional(),
        memecoinVibe: z.string().optional(),
        defiRevenue: z.string().optional(),
        defiMechanism: z.string().optional(),
        aiModelType: z.string().optional(),
        aiDataMoat: z.string().optional(),
        defiSecurityMarks: z.array(z.string()).optional(),
        memecoinLaunchPreparation: z.array(z.string()).optional(),
        aiInfraReadiness: z.array(z.string()).optional(),
        targetTVL: z.string().optional(),
        targetMarketCap: z.string().optional(),
        targetDAU: z.string().optional(),
        mvpScope: z.string().optional(),
        goToMarketPlan: z.string().optional(),
        launchLiquidityPlan: z.string().optional(),
        tokenAddress: z.string().optional(),
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

        // Mock window.alert
        window.alert = vi.fn();
    });

    it('renders the landing view initially', () => {
        render(<StudioPage />);

        // Check for heading content
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent(/Studio/i);

        // Check for description
        expect(screen.getByText(/Advanced AI Evaluation Protocol for Web3 Assets/i)).toBeInTheDocument();

        // Check that the form is visible immediately (Step 1)
        expect(screen.getByText('The Vision')).toBeInTheDocument();
        expect(screen.getByText('Target Sector')).toBeInTheDocument();
    });

    it('shows validation errors when attempting to proceed with empty form', async () => {
        render(<StudioPage />);

        // Try to go to next step without filling anything
        fireEvent.click(screen.getByText('Add Context'));

        // Wait for state update and check for any validation error
        await waitFor(() => {
            // Check for the error paragraph elements
            const errorElement = screen.getByText(/Description is too short/i);
            expect(errorElement).toBeInTheDocument();
        });

        // Project Type should NOT error because it has a default
        expect(screen.queryByText(/Please select a project type/i)).not.toBeInTheDocument();
    }, 15000);

    it('submits successfully with valid data through wizard steps', async () => {
        // Mock API responses based on URL
        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes('/api/idea-evaluator/quota')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ limit: 3, remaining: 3, reset: Date.now() + 86400000 })
                });
            }
            // Mock the streaming endpoint
            if (url.includes('/api/idea-evaluator/evaluate-stream')) {
                const mockResult = {
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
                };

                // Create a mock SSE stream
                const sseData = [
                    'event: step\ndata: {"step":"Initializing..."}\n\n',
                    'event: step\ndata: {"step":"Analyzing..."}\n\n',
                    `event: complete\ndata: {"result":${JSON.stringify(mockResult)}}\n\n`
                ].join('');

                const encoder = new TextEncoder();
                const stream = new ReadableStream({
                    start(controller) {
                        controller.enqueue(encoder.encode(sseData));
                        controller.close();
                    }
                });

                return Promise.resolve({
                    ok: true,
                    body: stream
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
        fireEvent.click(screen.getByText(/DeFi/i)); // Project Type
        const descriptionInput = screen.getByPlaceholderText(/Describe your project.../i);
        fireEvent.change(descriptionInput, { target: { value: 'A decentralized exchange for memecoins on Solana' } });

        fireEvent.click(screen.getByText('Add Context'));

        // --- STEP 2: EXECUTION ---
        await waitFor(() => expect(screen.getByText('Team Composition')).toBeInTheDocument());

        // Use getByRole for accurate button selection including the label text
        fireEvent.click(screen.getByText(/2-5 Devs/i));

        // Wait for animation frame or just robustness
        await waitFor(() => expect(screen.getByText('Security Audit')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Security Audit'));
        fireEvent.click(screen.getByText('Multisig / DAO'));

        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

        // --- STEP 3: STRATEGY ---
        await waitFor(() => expect(screen.getByText('MVP Scope (6-12m)')).toBeInTheDocument());

        // These fields are optional/text areas in the new form
        const mvpInput = screen.getByPlaceholderText(/Define deliverables.../i);
        fireEvent.change(mvpInput, { target: { value: 'Basic AMM' } });

        fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

        // --- STEP 4: GOALS ---
        await waitFor(() => expect(screen.getByText('Success Metric')).toBeInTheDocument());

        const successInput = screen.getByPlaceholderText(/Target TVL/i);
        fireEvent.change(successInput, { target: { value: '1M TVL' } });

        fireEvent.click(screen.getByText('Short Verdict')); // Response Style

        // Submit
        const submitButton = screen.getByRole('button', { name: /Analyze Idea/i });
        fireEvent.click(submitButton);

        // The form is now replaced with the ReasoningTerminal component during submission
        expect(screen.getByText(/LIVE ANALYSIS RUNNING/i)).toBeInTheDocument();

        // Verify fetch was called at least once (quota + evaluate)
        expect(global.fetch).toHaveBeenCalled();

        // Wait for report step
        await waitFor(() => {
            expect(screen.getByText(/Great Idea Title/i)).toBeInTheDocument();
            expect(screen.getByText('85')).toBeInTheDocument();
            // Note: 'Technically sound' (result.technical.comments) is not rendered by the component
            expect(screen.getByText('High competition')).toBeInTheDocument();
        }, { timeout: 10000 });
    }, 15000);

    it('shows smart conditional fields based on project type', async () => {
        render(<StudioPage />);

        // Immediate check
        expect(screen.getByText('The Vision')).toBeInTheDocument();

        // Select Memecoin -> Should show "Community Vibe"
        fireEvent.click(screen.getByText('Memecoin'));
        expect(screen.getByText('Community Vibe')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. PolitiFi, Cats...')).toBeInTheDocument();

        // Select DeFi -> Should show "Core Mechanism"
        fireEvent.click(screen.getByText('DeFi'));
        expect(screen.getByText('Mechanism Design')).toBeInTheDocument();
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
        fireEvent.change(screen.getByPlaceholderText(/Describe your project.../i), { target: { value: 'A memecoin about coding.' } });

        // Next to Execution
        fireEvent.click(screen.getByText('Add Context'));
        await waitFor(() => screen.getByText('Team Composition'));

        // Check Memecoin Checklist
        expect(screen.getByText('KOLs & Warband Ready')).toBeInTheDocument();
        expect(screen.queryByText('Security Audit')).not.toBeInTheDocument();

        // Select Team Size (required)
        fireEvent.click(screen.getByLabelText(/Solo/i));

        // Next to Strategy (skip)
        fireEvent.click(screen.getByText('Next Step'));
        await waitFor(() => screen.getByText('MVP Scope (6-12m)'));

        // Fill MVP Scope (required)
        fireEvent.change(screen.getByPlaceholderText(/Define deliverables.../i), { target: { value: 'A simple token launcher.' } });

        // Next to Goals
        fireEvent.click(screen.getByText('Next Step'));
        await waitFor(() => screen.getByText('Success Metric'));

        // Check Memecoin Goal
        expect(screen.getByPlaceholderText(/Target Market Cap/i)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/Target TVL/i)).not.toBeInTheDocument();
    });
});

