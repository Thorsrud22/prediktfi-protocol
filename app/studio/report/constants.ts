export const SCORE_THRESHOLDS = {
    STRONG: 75,
    WATCHLIST: 50,
    PASS: 30, // Implicitly below 50 is watchlist/pass, but 30 is the red threshold
    // Colors often switch at 60 in the original code for text-emerald-400
    GOOD: 60
} as const;

export const URLS = {
    PREDIKT_HOME: 'https://prediktfi.xyz',
    SHARE_BASE: 'https://prediktfi.xyz/share',
    IDEA_BASE: 'https://prediktfi.xyz/idea',
    TWITTER_INTENT: 'https://twitter.com/intent/tweet',
} as const;

export const LIMITS = {
    RED_FLAGS: 5,
    CLAIMS: 8,
    EVIDENCE_DISPLAY: 2,
    COMPETITORS: 4,
    RISKS: 5,
    DEBUG_REASONS: 4,
} as const;

export const SCORE_LABELS = {
    STRONG: 'Strong Potential',
    WATCHLIST: 'Watchlist',
    PASS: 'Pass',
} as const;
