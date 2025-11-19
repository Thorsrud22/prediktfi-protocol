import { NextRequest, NextResponse } from 'next/server';
import { ideaSubmissionSchema } from '@/lib/ideaSchema';
import { IdeaEvaluationResult } from '@/lib/ideaEvaluationTypes';
import { z } from 'zod';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = ideaSubmissionSchema.parse(body);

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mock evaluation logic based on project type
        let overallVerdict = 'Interesting concept with potential.';
        let successProbability = 50;
        let pros: string[] = [];
        let cons: string[] = [];
        let improvements: string[] = [];
        let riskAnalysis: string[] = [];

        switch (validatedData.projectType) {
            case 'memecoin':
                overallVerdict = 'High risk, high reward potential. Community is key.';
                successProbability = 20;
                pros = ['Viral potential', 'Low barrier to entry'];
                cons = ['Saturated market', 'High volatility'];
                improvements = ['Focus on unique branding', 'Build community early'];
                riskAnalysis = ['Rug pull perception risk', 'Liquidity challenges'];
                break;
            case 'defi':
                overallVerdict = 'Solid utility, but requires strong security audit.';
                successProbability = 65;
                pros = ['Clear revenue model', 'Growing ecosystem'];
                cons = ['Regulatory uncertainty', 'Smart contract risks'];
                improvements = ['Audit smart contracts', 'Simplify UI/UX'];
                riskAnalysis = ['Exploit risk', 'Impermanent loss for users'];
                break;
            case 'nft':
                overallVerdict = 'Creative, but utility needs to be clear.';
                successProbability = 40;
                pros = ['Strong community engagement', 'IP potential'];
                cons = ['Market downturn', 'Liquidity issues'];
                improvements = ['Add utility beyond art', 'Partner with other projects'];
                riskAnalysis = ['Floor price crash', 'Copyright issues'];
                break;
            case 'game':
                overallVerdict = 'Engaging, but retention is the challenge.';
                successProbability = 55;
                pros = ['High engagement', 'In-game economy'];
                cons = ['High development cost', 'User acquisition cost'];
                improvements = ['Focus on gameplay first', 'Sustainable tokenomics'];
                riskAnalysis = ['Economy collapse', 'Botting'];
                break;
            case 'infra_ai':
                overallVerdict = 'High demand, but technically complex.';
                successProbability = 75;
                pros = ['Market trend', 'High value add'];
                cons = ['High compute costs', 'Technical difficulty'];
                improvements = ['Start with a niche', 'Optimize for cost'];
                riskAnalysis = ['Competition from giants', 'Model hallucination'];
                break;
            default:
                overallVerdict = 'Unique idea, needs more market validation.';
                successProbability = 50;
                pros = ['Novelty', 'First mover advantage'];
                cons = ['Unproven market', 'Education barrier'];
                improvements = ['Validate with MVP', 'Gather user feedback'];
                riskAnalysis = ['Market rejection', 'Execution risk'];
        }

        // Adjust based on team size
        if (validatedData.teamSize === 'solo') {
            successProbability -= 10;
            cons.push('Limited bandwidth as solo founder');
        } else if (validatedData.teamSize === 'team_6_plus') {
            successProbability += 5;
            pros.push('Strong team capacity');
        }

        // Adjust based on resources
        if (validatedData.resources.includes('budget')) {
            successProbability += 10;
            pros.push('Has budget for marketing/dev');
        }

        // Clamp probability
        successProbability = Math.max(0, Math.min(100, successProbability));

        const result: IdeaEvaluationResult = {
            evaluationId: `eval_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            overallVerdict,
            successProbability,
            pros,
            cons,
            improvements,
            riskAnalysis,
            confidenceScore: 0.85, // Mock confidence
        };

        return NextResponse.json(result);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: 'Validation failed', errors: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
