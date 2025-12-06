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
The helper produces a structured memo, strictly typed as follows (v1 Implementation):

```typescript
export interface CompetitiveMemo {
    // Core Fields
    categoryLabel: string; // e.g. "DeFi - Lending", "Memecoin - Animal"
    crowdednessLevel: 'empty' | 'moderate' | 'high' | 'saturated';
    shortLandscapeSummary: string; // 1-2 sentence high-level summary.
    
    referenceProjects: {
        name: string;
        chainOrPlatform: string;
        note: string;
    }[];
    
    tractionDifficulty: {
        label: 'low' | 'medium' | 'high' | 'extreme';
        explanation: string;
    };

    differentiationWindow: {
        label: 'wide_open' | 'narrow' | 'closed';
        explanation: string;
    };

    noiseVsSignal: 'mostly_noise' | 'mixed' | 'high_signal';
    evaluatorNotes: string;

    // Category Specific Hints (Optional/Nullable)
    memecoin?: {
        narrativeLabel: string;
        narrativeCrowdedness: 'low' | 'medium' | 'high';
    };
    defi?: {
        defiBucket: string;
        categoryKings: string[];
    };
    ai?: {
        aiPattern: string;
        moatType: string;
    };
    
    timestamp: string;
}
```

## 4. Evaluator Integration Spec

### Trigger Conditions
The `evaluateIdea` function should ONLY call `fetchCompetitiveMemo` if the idea's normalized category is one of:
- `memecoin`
- `defi`
- `ai`

For all other categories, skip this step to save Token costs and latency.

### Handling Status
- **`status: "ok"`**: The resulting `CompetitiveMemo` object should be formatted into a string block (JSON or bullet points) and injected into the Main Evaluator Prompt.
- **`status: "not_available"`**: The prompt section should be omitted entirely or replaced with a generic "No specific competitive data available. Rely on general knowledge." instruction. The Evaluator must NOT fail because this side-channel data is missing.

### Conceptual Relationship
The Evaluator uses three data pillars to form a verdict:
1.  **Market Snapshot** (Macro): "Is the TIMING right?". Used for "Risk On/Off" calibration.
2.  **Crypto Native Health** (Safety): "Is it SAFE?". Used for Rug Risk and Launch Readiness.
3.  **Competitive Memo** (Micro): "Is it UNIQUE?". Used heavily for:
    - **Moat / Feasibility Score**: If `differentiationWindow` is "closed", score must be capped.
    - **Market Fit Score**: If `crowdednessLevel` is "saturated" but `tractionDifficulty` is "high", score should reflect reduced probability of success.

### Prompt Injection Strategy
When available, inject the following block into the System Prompt or User Context:

```text
COMPETITIVE_MEMO (Real-time Intel):
- Category: [categoryLabel]
- Crowdedness: [crowdednessLevel]
- Landscape: [shortLandscapeSummary]
- Known Competitors: [referenceProjects (Name + Note only)]
- Evaluator Note: [evaluatorNotes]

INSTRUCTION: Use this data to ground your 'Moat' and 'Market Fit' scores. 
If the memo says the space is saturated, be very skeptical of "revolutionary" claims. 
Do NOT invent new competitors not listed here or known to you.
```

## 5. Future Phases

### Phase 2: Report UI Section (Frontend)
- Add a dedicated "Competitive Landscape" tab or card in the Report.
- Show the "Crowdedness Meter" visual.
- List the competitors found with clickable links.

### Phase 3: "Deep Dive" Mode
- Allow users to click "Analyze Competitors" to spawn a deeper, multi-step research agent that actively browses competitor docs and whitepapers.

## 6. Memecoin Intelligence Helper Spec

### Objective
For memecoin ideas, the Helper must answer three critical questions to prevent investors from buying into "dead" or "low-effort" coins:
1.  **Trend Alignment**: Is this narrative (e.g. "Grimace Shake", "PolitiFi", "Cute Cat") currently trending or 3 weeks dead?
2.  **Saturation Check**: Are there already 50+ tickers with this name or concept created in the last 24h?
3.  **Differentiation**: Does the project have a unique angle (e.g. high-effort art, novel mechanism) or is it a low-effort fork?

### Candidate Data Sources (Conceptual)
We will eventually integrate specialized memecoin data providers:

| Source | Priority | What to Extract | Purpose |
|--------|----------|-----------------|---------|
| **DexScreener API** | Must-Have | Top pairs by volume in last 24h matching keywords. | Identify if the specific ticker/name is already saturated. |
| **Axiom.trade / GMGN** | Nice-to-Have | "Smart Money" flow into specific narratives. | Judge if the narrative is "early" or "dumping". |
| **Twitter Search** | Must-Have | Cashtag () volume and sentiment. | Measure "Mindshare" vs "Market Cap". |

### Bridge to CompetitiveMemo
The raw signals from these sources map directly to `CompetitiveMemo` fields:

- **`memecoin.narrativeLabel`**: Derived from the idea description (e.g. "Cat Coin"). Validated against DexScreener trending tags.
- **`memecoin.narrativeCrowdedness`**: 
    - *Low*: < 5 tokens with same name created in 24h.
    - *High*: > 20 tokens with same name.
    - *Saturated*: A dominant coin with >0M market cap already exists with this name.
- **`referenceProjects`**: The top 1-3 existing coins with the same name/theme by Liquidity.
- **`differentiationWindow`**: 
    - *Closed*: If a "Category King" exists (e.g. DOGE for Dog coins).
    - *Narrow*: If narrative is trending but no clear winner yet.
    - *Wide Open*: If narrative is brand new (Blue Ocean).
