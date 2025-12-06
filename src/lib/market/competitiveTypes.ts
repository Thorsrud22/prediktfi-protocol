export interface CompetitiveMemo {
    /**
     * High-level summary of the space
     */
    landscape: LandscapeSummary;

    /**
     * Specific similar projects found
     */
    competitors: Competitor[];

    /**
     * Specific advice for differentiation
     */
    strategicAdvice: StrategicAdvice;

    /**
     * ISO timestamp of when this memo was generated
     */
    timestamp: string;
}

export interface LandscapeSummary {
    crowdedness: 'empty' | 'moderate' | 'saturated';
    /**
     * Short description of the current narrative meta
     * e.g. "AI x Crypto is heating up, but mostly infra"
     */
    dominantNarrative: string;
    /**
     * Names of the major players in this sector
     */
    majors: string[];
}

export interface Competitor {
    name: string;
    url?: string;
    status: 'live' | 'buidling' | 'abandoned' | 'unknown';
    /**
     * How different is our user's idea from this competitor?
     */
    differentiationGap: 'high' | 'medium' | 'low';
    /**
     * Brief notes on what this competitor does and how it compares
     */
    notes: string;
}

export interface StrategicAdvice {
    differentiationOpps: string[]; // "Focus on UX...", "Target non-crypto users..."
    featuresToAvoid: string[]; // "Don't build another generic AMM unless..."
}
