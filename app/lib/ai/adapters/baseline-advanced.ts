import { PredictInput, PredictOutput } from '../kernel';
import { EnhancedPredictOutput } from '../enhanced-types';
import { AnalysisEngine } from '../analysis-engine';
import { slugify, nowTs } from '../util';
import { mockAdapter } from './mock';

export async function baselineAdapter(input: PredictInput): Promise<PredictOutput> {
  const scenarioId = slugify(`${input.topic}-${input.question}-${input.horizon}`);
  
  try {
    // Extract crypto symbol from topic or question
    const text = `${input.topic} ${input.question}`.toLowerCase();
    let symbol = 'bitcoin'; // default
    
    if (text.includes('btc') || text.includes('bitcoin')) symbol = 'bitcoin';
    else if (text.includes('eth') || text.includes('ethereum')) symbol = 'ethereum';
    else if (text.includes('sol') || text.includes('solana')) symbol = 'solana';
    else if (text.includes('ada') || text.includes('cardano')) symbol = 'cardano';

    // Initialize advanced analysis engine
    const analysisEngine = new AnalysisEngine();
    
    // Perform comprehensive analysis with progress tracking
    console.log(`Starting advanced analysis for ${symbol}...`);
    const startTime = Date.now();
    
    const analysis = await analysisEngine.performAdvancedAnalysis(
      symbol,
      input.question,
      input.horizon,
      (status, progress) => {
        console.log(`[${progress}%] ${status}`);
      }
    );

    const processingTime = Math.round((Date.now() - startTime) / 1000 * 100) / 100;
    
    // Extract key insights for the traditional format
    const mainScenario = analysis.scenarios.find(s => s.name === 'likely') || analysis.scenarios[0];
    
    // Generate enhanced drivers based on actual analysis
    const drivers = [
      `Technical: ${analysis.technical.trend} trend (${analysis.technical.change24h > 0 ? '+' : ''}${analysis.technical.change24h.toFixed(1)}% 24h)`,
      `Sentiment: ${analysis.sentiment.overallSentiment} (F&G: ${analysis.sentiment.fearGreedIndex || 'N/A'})`,
      `Risk Level: ${analysis.risks.length > 2 ? 'High' : analysis.risks.length > 0 ? 'Medium' : 'Low'} (${analysis.risks.length} factors)`
    ];

    // Generate comprehensive rationale
    const confidenceLabel = analysis.confidence > 0.7 ? 'high' : analysis.confidence > 0.4 ? 'moderate' : 'low';
    const rationale = `Advanced ${processingTime}s analysis with ${confidenceLabel} confidence (${Math.round(analysis.confidence * 100)}%). ${analysis.methodology}`;

    // Create enhanced output
    const enhancedOutput: EnhancedPredictOutput = {
      prob: analysis.probability,
      drivers,
      rationale,
      model: 'advanced-baseline-v1',
      scenarioId,
      ts: nowTs(),
      analysis,
      confidence: analysis.confidence,
      processingTime
    };

    return enhancedOutput;
    
  } catch (error) {
    console.warn('Advanced baseline adapter failed, using mock fallback:', error);
    return await mockAdapter(input);
  }
}
