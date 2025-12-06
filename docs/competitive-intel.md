# PrediktFi Design: Competitive Intelligence Helper

## 1. Objective
The Competitive Intelligence Helper is a specialized side-agent designed to provide builders and investors with a "reality check" regarding the competitive landscape. Its primary goal is to answer:
- *Who else is actively building this?*
- *How crowded is the space?*
- *What specific features or traction metrics are required to stand out?*

By automating this research, PrediktFi saves users from manual Googling and provides a more data-driven basis for the "Moat" and "Market Fit" scores.

## 2. Data Sources (Conceptual)
To generate a high-quality memo, the agent would query a mix of structured and unstructured sources.

| Source Category | Specific Sources (Examples) | Purpose |
|-----------------|---------------------------|---------|
| **Web Search** | Google / Bing via Serper or similar | General discovery of similar landing pages, news articles, and blogs. |
| **Crypto Aggregators** | CoinGecko, DeFiLlama, DappRadar | Identify live token projects, TVL stats, and active protocols in the same category. |
| **Code Repositories** | GitHub, GitLab | Assess "real" development activity vs. vaporware (activity cliffs, fork status). |
| **Social / Sentiment** | Twitter/X (via API or specialized indexers) | Gauge "mindshare" and narrative heat. Is this category trending or dead? |

## 3. Output Shape (`CompetitiveMemo`)
The helper will produce a structured memo, independent of the main evaluation, which can be fed into the main evaluator or displayed separately.

```typescript
export interface CompetitiveMemo {
  // High-level summary of the space
  landscape: {
    crowdedness: 'empty' | 'moderate' | 'saturated';
    dominantNarrative: string; // e.g. "AI x Crypto is heating up, but mostly infra"
    majors: string[]; // e.g. ["Bittensor", "Gensyn"]
  };
  
  // Specific similar projects found
  competitors: {
    name: string;
    url?: string;
    status: 'live' | 'buidling' | 'abandoned' | 'unknown';
    differentiationGap: 'high' | 'medium' | 'low'; // How different is our user's idea?
    notes: string;
  }[];

  // Specific advice for differentiation
  strategicAdvice: {
    differentiationOpps: string[]; // "Focus on UX...", "Target non-crypto users..."
    featuresToAvoid: string[]; // "Don't build another generic AMM unless..."
  };
    
  timestamp: string;
}
```

## 4. Integration Points

### Phase 1: Context Injection (Backend)
- Run the `CompetitiveHelper` **parallel** to the main `evaluateIdea` call (or strictly before).
- Inject the `CompetitiveMemo` into the `evaluateIdea` prompt as "Market Context".
- This allows the main evaluator to make specific comparisons: *"Unlike Competitor X, this idea focuses on..."*

### Phase 2: Report UI Section (Frontend)
- Add a dedicated "Competitive Landscape" tab or card in the Report.
- Show the "Crowdedness Meter" visual.
- List the competitors found with clickable links.

### Phase 3: "Deep Dive" Mode
- Allow users to click "Analyze Competitors" to spawn a deeper, multi-step research agent that actively browses competitor docs and whitepapers.

## 5. Cost and Complexity

### Risks & Costs
1.  **API Rate Limits & Cost**: High-quality search (like Tavily or Serper) and specific crypto APIs can be expensive at scale.
    - *Mitigation*: Cache results by category (e.g. cache "DeFi Lending" landscape for 24h).
2.  **Latency**: Real-time searching adds significant time (5-10s+).
    - *Mitigation*: Run asynchronously. streaming the main evaluation first, then "unlocking" the competitor insights when ready.
3.  **Noise**: Keyword search often returns SEO spam or irrelevant projects.
    - *Mitigation*: Strict LLM filtering step to discard irrelevant results before final memo generation.
4.  **Stale Data**: Crypto moves fast. "Live" projects might be rugged/dead.
    - *Mitigation*: Check last tweet date or GitHub commit date if possible.

### Implementation Effort
- **Low**: Defining types and basic prompts.
- **Medium**: Integrating search tools (using Vercel SDK or LangChain).
- **High**: robust filtering and multi-source aggregation (DeFiLlama + Twitter + GitHub).
