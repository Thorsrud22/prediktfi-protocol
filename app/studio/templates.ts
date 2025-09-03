// Studio templates for quick insight creation

export interface Template {
  id: string;
  label: string;
  topic: string;
  question: string;
  horizon: string;
  category: 'crypto' | 'politics' | 'sports' | 'macro' | 'tech' | 'markets';
  assist: (nowTs: number, baselineProb?: number) => {
    drivers: string[];
    rationale: string;
  };
}

export const TEMPLATES: Template[] = [
  {
    id: 'crypto_btc_3m',
    label: 'Bitcoin $85k (3 months)',
    topic: 'crypto',
    question: 'Will BTC close above $85k in the next 3 months?',
    horizon: '3months',
    category: 'crypto',
    assist: (nowTs, baselineProb = 0.45) => ({
      drivers: [
        'Current BTC price momentum and technical indicators',
        'Institutional adoption trends and ETF flows',
        'Macroeconomic conditions (Fed policy, inflation)',
        'Market cycle analysis and historical patterns'
      ],
      rationale: `Bitcoin's path to $85k depends on several key factors. Current technical momentum ${baselineProb > 0.5 ? 'supports' : 'challenges'} this target. Institutional demand through ETFs continues to provide structural support, while macro conditions and Federal Reserve policy will influence risk appetite. Historical patterns suggest significant moves are possible within 3-month timeframes during bull cycles.`
    })
  },
  {
    id: 'crypto_alt_30d',
    label: 'SOL vs ETH (30 days)',
    topic: 'crypto',
    question: 'Will SOL outperform ETH by >10% over the next 30 days?',
    horizon: '30d',
    category: 'crypto',
    assist: (nowTs, baselineProb = 0.35) => ({
      drivers: [
        'Solana ecosystem growth and DeFi activity',
        'Ethereum network developments and Layer 2 adoption',
        'Relative trading volumes and market cap ratios',
        'Upcoming network upgrades or major announcements'
      ],
      rationale: `SOL vs ETH performance depends on ecosystem momentum and relative adoption. Solana's lower fees and faster transactions drive DeFi activity, while Ethereum's Layer 2 solutions are maturing. Short-term outperformance often correlates with ecosystem announcements, developer activity, and institutional flows. The 10% threshold requires significant relative momentum.`
    })
  },
  {
    id: 'politics_election_6m',
    label: 'Election outcome (6 months)',
    topic: 'politics',
    question: 'Will the incumbent party win the upcoming election?',
    horizon: '6months',
    category: 'politics',
    assist: (nowTs, baselineProb = 0.50) => ({
      drivers: [
        'Current polling averages and historical accuracy',
        'Economic indicators and voter satisfaction',
        'Campaign fundraising and organization strength',
        'Demographic shifts and voter turnout models'
      ],
      rationale: `Electoral outcomes depend on polling trends, economic conditions, and campaign effectiveness. Historical data shows incumbent advantage varies with economic performance and approval ratings. Polling accuracy has evolved, and demographic modeling incorporates turnout patterns. Six months allows for significant campaign developments and voter sentiment shifts.`
    })
  },
  {
    id: 'sports_final_30d',
    label: 'Championship final (30 days)',
    topic: 'sports',
    question: 'Will the favored team win the championship final?',
    horizon: '30d',
    category: 'sports',
    assist: (nowTs, baselineProb = 0.60) => ({
      drivers: [
        'Team performance statistics and recent form',
        'Head-to-head historical matchups',
        'Player injuries and availability',
        'Home field advantage and crowd support'
      ],
      rationale: `Championship predictions require analyzing team strength, recent performance, and contextual factors. Statistical models favor teams with better regular season records, but playoff dynamics can shift dramatically. Injury reports, momentum, and pressure handling become critical. Home field advantage typically provides 5-10% improvement in win probability.`
    })
  },
  {
    id: 'macro_cpi_next',
    label: 'CPI inflation (next release)',
    topic: 'macro',
    question: 'Will next CPI reading come in above consensus forecast?',
    horizon: '1month',
    category: 'macro',
    assist: (nowTs, baselineProb = 0.45) => ({
      drivers: [
        'Leading inflation indicators and commodity prices',
        'Labor market tightness and wage growth',
        'Housing costs and rental market trends',
        'Base effects from prior year comparisons'
      ],
      rationale: `CPI forecasting involves tracking leading indicators like commodity prices, wage growth, and housing costs. Consensus forecasts incorporate these factors but can miss rapid changes in underlying trends. Base effects from year-over-year comparisons create predictable impacts, while supply chain disruptions add volatility. Recent Fed policy affects expectations.`
    })
  },
  {
    id: 'tech_launch_90d',
    label: 'Product launch (90 days)',
    topic: 'tech',
    question: 'Will the major tech product launch meet its announced timeline?',
    horizon: '90d',
    category: 'tech',
    assist: (nowTs, baselineProb = 0.65) => ({
      drivers: [
        'Company\'s historical track record on launch dates',
        'Regulatory approval requirements and status',
        'Supply chain readiness and manufacturing capacity',
        'Beta testing feedback and technical challenges'
      ],
      rationale: `Product launch timing depends on technical readiness, regulatory approval, and market positioning. Companies with strong execution track records have higher success rates, while complex products face more delays. Regulatory requirements can extend timelines unpredictably. Beta testing reveals technical issues, and supply chain constraints affect hardware launches.`
    })
  },
  {
    id: 'markets_fomc_14d',
    label: 'Fed rate decision (14 days)',
    topic: 'markets',
    question: 'Will the Fed raise rates at the next FOMC meeting?',
    horizon: '14d',
    category: 'markets',
    assist: (nowTs, baselineProb = 0.25) => ({
      drivers: [
        'Recent inflation data and labor market indicators',
        'Fed officials\' speeches and guidance',
        'Market pricing in fed funds futures',
        'Financial stability and banking sector stress'
      ],
      rationale: `Fed decisions follow data-dependent frameworks focusing on employment and inflation mandates. Recent economic indicators, especially inflation and jobs data, heavily influence decisions. Fed officials telegraph intentions through speeches, while market pricing reflects expectations. Financial stability concerns can override base case scenarios, particularly during banking stress.`
    })
  },
  {
    id: 'custom_trend_7d',
    label: 'Custom trend (7 days)',
    topic: 'custom',
    question: 'Will this trend continue for the next week?',
    horizon: '7d',
    category: 'markets',
    assist: (nowTs, baselineProb = 0.55) => ({
      drivers: [
        'Current momentum and technical indicators',
        'Fundamental factors driving the trend',
        'Market sentiment and positioning',
        'Upcoming events or catalysts'
      ],
      rationale: `Short-term trend continuation depends on momentum sustainability and catalyst timing. Technical analysis suggests trends persist until exhaustion signals appear. Fundamental drivers must remain supportive, while sentiment and positioning can create reversal risks. Seven-day timeframes are sensitive to news events and market microstructure effects.`
    })
  }
];

// Get last used template from localStorage
export function getLastTemplate(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('predikt:lastTemplate');
}

// Save template selection
export function saveLastTemplate(templateId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('predikt:lastTemplate', templateId);
}

// Find template by ID
export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}
