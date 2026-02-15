import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import StudioPage from '../app/studio/page';
import ToastProvider from '../app/components/ToastProvider';

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
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
        localStorage.clear();

        // Default mock for Quota calls
        (global.fetch as any).mockImplementation((url: string) => {
            if (url && url.toString().includes('/api/idea-evaluator/quota')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ limit: 3, remaining: 3, resetAt: Date.now() + 86400000 })
                });
            }
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });

        window.alert = vi.fn();
    });

    afterEach(() => {
        cleanup();
    });

    const waitForWizardReady = async () => {
        // Wait for quota loading to finish
        await waitFor(() => {
            expect(screen.queryByText(/Synchronizing Protocol Quota/i)).not.toBeInTheDocument();
        }, { timeout: 4000 });

        // Ensure we see Step 0 content
        await screen.findByText(/Select Sector/i);
    };

    // Helper to wait for state to settle in tests
    const settle = () => new Promise(r => setTimeout(r, 75));

    it('renders the wizard initially after quota loads', async () => {
        render(
            <ToastProvider>
                <StudioPage />
            </ToastProvider>
        );

        await waitForWizardReady();

        // Check for project types
        expect(screen.getByText('Memecoin')).toBeInTheDocument();
        expect(screen.getByText('DeFi / Utility')).toBeInTheDocument();
        expect(screen.getByText('AI Agent')).toBeInTheDocument();
    });

    it('submits successfully with valid data via wizard steps', async () => {
        // Mock the streaming endpoint
        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes('/api/idea-evaluator/quota')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ limit: 3, remaining: 3, resetAt: Date.now() + 86400000 })
                });
            }
            if (url.includes('/api/idea-evaluator/evaluate-stream')) {
                const mockResult = {
                    overallScore: 85,
                    summary: { title: 'Test Idea', oneLiner: 'A test project', mainVerdict: 'Good' },
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

        render(
            <ToastProvider>
                <StudioPage />
            </ToastProvider>
        );

        await waitForWizardReady();

        // 1. Step 0: Select Project Type
        fireEvent.click(screen.getByRole('button', { name: /Memecoin/i }));
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        // 2. Step 1: Project Identity
        await screen.findAllByText(/Project Identity/i);
        const tickerInput = await screen.findByPlaceholderText(/\$TICKER|Project Name/i);
        fireEvent.change(tickerInput, { target: { value: 'TEST' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        // 3. Step 2: The Pitch
        await screen.findAllByText(/The Pitch/i);
        const descInput = await screen.findByPlaceholderText(/Explain|Describe/i);
        fireEvent.change(descInput, { target: { value: 'This is a test memecoin description that is long enough.' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        // 4. Step 3: Strategic Insights
        await screen.findByText(/Strategic Insights/i);
        fireEvent.click(screen.getByText('Review'));
        await settle();

        // 5. Step 4: Review & Submit
        await screen.findByText(/Ready to Launch?/i);
        const submitBtn = await screen.findByRole('button', { name: /Generate Report/i });
        fireEvent.click(submitBtn);

        // 6. Verify Terminal/Report appears
        await waitFor(() => {
            expect(screen.getByText(/Analysis Complete|predikt/i)).toBeInTheDocument();
        }, { timeout: 5000 });
    }, 15000);

    it('shows memecoin conditional fields in wizard', async () => {
        render(
            <ToastProvider>
                <StudioPage />
            </ToastProvider>
        );

        await waitForWizardReady();

        fireEvent.click(screen.getByRole('button', { name: /Memecoin/i }));
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();
        await screen.findAllByText(/Project Identity/i);
        const tickerInput = await screen.findByPlaceholderText(/\$TICKER|Project Name/i);
        fireEvent.change(tickerInput, { target: { value: 'TEST' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();
        await screen.findAllByText(/The Pitch/i);
        const descInput = await screen.findByPlaceholderText(/Explain|Describe/i);
        fireEvent.change(descInput, { target: { value: 'Valid description for testing purposes.' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        // Verify Insights Step
        await screen.findByText(/Strategic Insights/i);
        expect(await screen.findByLabelText('Community Vibe')).toBeInTheDocument();
        expect(await screen.findByLabelText('Primary Narrative')).toBeInTheDocument();
    });

    it('shows AI Agent conditional fields in wizard', async () => {
        render(
            <ToastProvider>
                <StudioPage />
            </ToastProvider>
        );

        await waitForWizardReady();

        fireEvent.click(screen.getByRole('button', { name: /AI Agent/i }));
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();
        await screen.findAllByText(/Project Identity/i);
        const aiNameInput = await screen.findByPlaceholderText(/\$TICKER|Project Name/i);
        fireEvent.change(aiNameInput, { target: { value: 'AI TEST' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();
        await screen.findAllByText(/The Pitch/i);
        const aiDescInput = await screen.findByPlaceholderText(/Explain|Describe/i);
        fireEvent.change(aiDescInput, { target: { value: 'Valid AI agent description for testing purposes.' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        // Verify AI Insights Step
        await screen.findByText(/Strategic Insights/i);
        expect(screen.queryByLabelText('Community Vibe')).not.toBeInTheDocument();
        expect(await screen.findByLabelText('Model Type')).toBeInTheDocument();
    });

    it.each([
        { sector: /NFT \/ Art/i, fieldOne: 'Utility Layer', fieldTwo: 'Collector Hook' },
        { sector: /Gaming/i, fieldOne: 'Core Gameplay Loop', fieldTwo: 'Economy Model' },
        { sector: /Other/i, fieldOne: 'Target User', fieldTwo: 'Differentiation' },
    ])('shows category-specific fields for $sector in Strategic Insights', async ({ sector, fieldOne, fieldTwo }) => {
        render(
            <ToastProvider>
                <StudioPage />
            </ToastProvider>
        );

        await waitForWizardReady();

        fireEvent.click(screen.getByRole('button', { name: sector }));
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        const nameInput = await screen.findByPlaceholderText(/\$TICKER|Project Name/i);
        fireEvent.change(nameInput, { target: { value: 'CATEGORY TEST' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        const descInput = await screen.findByPlaceholderText(/Explain|Describe/i);
        fireEvent.change(descInput, { target: { value: 'Valid category description for contextual field testing.' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        await screen.findByText(/Strategic Insights/i);
        expect(await screen.findByLabelText(fieldOne)).toBeInTheDocument();
        expect(await screen.findByLabelText(fieldTwo)).toBeInTheDocument();
    });

    it('shows soft-required context warning on review and still allows submit', async () => {
        render(
            <ToastProvider>
                <StudioPage />
            </ToastProvider>
        );

        await waitForWizardReady();

        fireEvent.click(screen.getByRole('button', { name: /AI Agent/i }));
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        const aiNameInput = await screen.findByPlaceholderText(/\$TICKER|Project Name/i);
        fireEvent.change(aiNameInput, { target: { value: 'AI WARN TEST' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        const aiDescInput = await screen.findByPlaceholderText(/Explain|Describe/i);
        fireEvent.change(aiDescInput, { target: { value: 'Valid AI description with empty contextual fields to trigger warning.' } });
        await settle();
        fireEvent.click(screen.getByText('Continue'));
        await settle();

        // Keep contextual fields empty, proceed to review
        fireEvent.click(screen.getByRole('button', { name: /Continue to review step/i }));
        await settle();

        await screen.findByText(/Ready to Launch\?/i);
        await screen.findByText(/Sector/i);
        expect(await screen.findByText(/Context Quality Warning/i)).toBeInTheDocument();
        expect(await screen.findByText(/missing category-specific inputs will reduce confidence and report quality/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Generate Report/i }));
        await waitFor(() => {
            expect((global.fetch as any)).toHaveBeenCalledWith(
                '/api/idea-evaluator/evaluate-stream',
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    it('verifies label-based field discovery and accessibility descriptions', async () => {
        render(
            <ToastProvider>
                <StudioPage />
            </ToastProvider>
        );
        await waitForWizardReady();

        // 1. Sector Step -> select one to proceed
        const memecoinBtn = screen.getByRole('button', { name: /Memecoin/i });
        fireEvent.click(memecoinBtn);
        await waitFor(() => {
            expect(memecoinBtn).toHaveAttribute('aria-pressed', 'true');
        });

        fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }));
        await settle();

        // 2. Step 1: Label discovery (project type can resolve to Ticker Symbol or Project Name)
        const nameLabel = await screen.findByLabelText(/Ticker Symbol|Project Name/i);
        expect(nameLabel).toHaveAttribute('id', 'project-name');

        // Validation/ARIA check
        fireEvent.change(nameLabel, { target: { value: 'A' } });
        fireEvent.keyDown(nameLabel, { key: 'Enter', code: 'Enter' });
        await settle();

        await screen.findByText(/Name must be at least 3 characters/i);
        await waitFor(() => {
            expect(nameLabel).toHaveAttribute('aria-describedby', expect.stringContaining('name-error'));
            expect(nameLabel).toHaveAttribute('aria-invalid', 'true');
        });

        // 3. Step 2: Label discovery
        fireEvent.change(nameLabel, { target: { value: 'VALID' } });
        await settle();
        fireEvent.click(screen.getByRole('button', { name: /Continue to next step/i }));
        await settle();

        const pitchLabel = await screen.findByLabelText(/The Pitch/i);
        expect(pitchLabel).toHaveAttribute('id', 'project-pitch');
        expect(pitchLabel).toHaveAttribute('aria-describedby', expect.stringContaining('pitch-counter'));
    });
});
