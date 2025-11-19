import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/idea-evaluator/evaluate/route';
import { NextRequest } from 'next/server';

describe('Idea Evaluator API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return a successful evaluation for a valid payload', async () => {
        const payload = {
            description: 'A decentralized exchange for memecoins on Solana',
            projectType: 'defi',
            teamSize: 'team_2_5',
            resources: ['time', 'skills', 'budget'],
            successDefinition: '1M TVL and 10k users',
            responseStyle: 'short',
            attachments: 'https://example.com/deck',
            focusHints: ['technical feasibility'],
        };

        const request = new NextRequest('http://localhost:3000/api/idea-evaluator/evaluate', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('evaluationId');
        expect(data).toHaveProperty('overallVerdict');
        expect(data).toHaveProperty('successProbability');
        expect(data.successProbability).toBeGreaterThan(0);
        expect(data.successProbability).toBeLessThanOrEqual(100);
        expect(data.pros).toBeInstanceOf(Array);
        expect(data.cons).toBeInstanceOf(Array);
        expect(data.improvements).toBeInstanceOf(Array);
        expect(data.riskAnalysis).toBeInstanceOf(Array);
        expect(data.confidenceScore).toBeGreaterThan(0);
    });

    it('should return validation error for invalid payload', async () => {
        const payload = {
            description: 'Too short', // Invalid: min 10 chars
            // Missing required fields
        };

        const request = new NextRequest('http://localhost:3000/api/idea-evaluator/evaluate', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toHaveProperty('message', 'Validation failed');
        expect(data).toHaveProperty('errors');
    });

    it('should adjust scoring based on inputs', async () => {
        // Test solo founder penalty
        const soloPayload = {
            description: 'A simple game for testing scoring logic',
            projectType: 'game',
            teamSize: 'solo',
            resources: ['time'],
            successDefinition: 'Just launch it',
            responseStyle: 'short',
        };

        const request = new NextRequest('http://localhost:3000/api/idea-evaluator/evaluate', {
            method: 'POST',
            body: JSON.stringify(soloPayload),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.cons).toContain('Limited bandwidth as solo founder');
    });
});
