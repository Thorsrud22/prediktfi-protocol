import type { ProjectDomain } from "@/lib/ai/domain-classifier";

export interface DomainCorpusItem {
  id: string;
  text: string;
  projectTypeHint?: string;
  expected: ProjectDomain;
}

export const DOMAIN_CORPUS: DomainCorpusItem[] = [
  {
    id: "defi-1",
    text: "A DeFi lending protocol with staking rewards, TVL milestones, and smart contract risk controls.",
    projectTypeHint: "defi",
    expected: "crypto_defi",
  },
  {
    id: "defi-2",
    text: "On-chain AMM for stable pairs with liquidity pool incentives and governance token voting.",
    expected: "crypto_defi",
  },
  {
    id: "defi-3",
    text: "Cross-chain wallet protocol focused on yield routing and secure bridge operations.",
    expected: "crypto_defi",
  },
  {
    id: "defi-4",
    text: "Protocol aggregates DEX liquidity and optimizes TVL growth with staking incentives.",
    expected: "crypto_defi",
  },
  {
    id: "defi-5",
    text: "Tokenized collateral platform with liquidation safeguards and oracle-backed pricing.",
    expected: "crypto_defi",
  },
  {
    id: "meme-1",
    text: "Memecoin launch with fair launch mechanics, bonding curve, and degen community growth loops.",
    projectTypeHint: "memecoin",
    expected: "memecoin",
  },
  {
    id: "meme-2",
    text: "Community token focused on meme narrative momentum and viral ticker distribution.",
    expected: "memecoin",
  },
  {
    id: "meme-3",
    text: "High-volatility meme token experiment with pump-resistant liquidity and holder incentives.",
    expected: "memecoin",
  },
  {
    id: "meme-4",
    text: "Degen-friendly launch strategy built around community raids and fair launch tokenomics.",
    expected: "memecoin",
  },
  {
    id: "ai-1",
    text: "AI workflow copilot using an LLM with fine-tune support, retrieval embeddings, and inference controls.",
    projectTypeHint: "ai",
    expected: "ai_ml",
  },
  {
    id: "ai-2",
    text: "Machine learning model training platform with GPU scheduling, dataset governance, and transformer pipelines.",
    expected: "ai_ml",
  },
  {
    id: "ai-3",
    text: "Enterprise assistant with model routing, RAG retrieval, and low-latency inference on private data.",
    expected: "ai_ml",
  },
  {
    id: "ai-4",
    text: "ML fraud detection with proprietary dataset feedback loops and automated retraining cadence.",
    expected: "ai_ml",
  },
  {
    id: "ai-5",
    text: "Generative AI design tool built on multimodal model inference and custom training datasets.",
    expected: "ai_ml",
  },
  {
    id: "saas-1",
    text: "B2B SaaS onboarding platform with subscription pricing, MRR tracking, and churn reduction workflows.",
    expected: "saas",
  },
  {
    id: "saas-2",
    text: "Enterprise workflow software with ARR expansion, per-seat pricing, and retention analytics.",
    expected: "saas",
  },
  {
    id: "saas-3",
    text: "Subscription CRM for support teams with churn alerts and account expansion playbooks.",
    expected: "saas",
  },
  {
    id: "saas-4",
    text: "Vertical SaaS product for clinics with B2B sales motion, annual contracts, and seat growth.",
    expected: "saas",
  },
  {
    id: "saas-5",
    text: "Per-user compliance automation suite focused on CAC payback and multi-year contract retention.",
    expected: "saas",
  },
  {
    id: "consumer-1",
    text: "Consumer social app with creator growth loops, referral retention, and mobile-first sharing.",
    expected: "consumer",
  },
  {
    id: "consumer-2",
    text: "Gaming marketplace for skins with influencer distribution and daily engagement loops.",
    projectTypeHint: "gaming",
    expected: "consumer",
  },
  {
    id: "consumer-3",
    text: "NFT collector app that improves discovery, community engagement, and creator monetization.",
    projectTypeHint: "nft",
    expected: "consumer",
  },
  {
    id: "consumer-4",
    text: "Mobile marketplace for local creators with viral sharing and repeat retention incentives.",
    expected: "consumer",
  },
  {
    id: "consumer-5",
    text: "Consumer habit app with social streaks, gamification, and influencer-driven acquisition.",
    expected: "consumer",
  },
  {
    id: "hardware-1",
    text: "IoT hardware device with sensor firmware, chip constraints, and contract manufacturing.",
    expected: "hardware",
  },
  {
    id: "hardware-2",
    text: "Robotics controller board with PCB design, factory sourcing, and BOM optimization.",
    expected: "hardware",
  },
  {
    id: "hardware-3",
    text: "Industrial monitoring device with supply chain risk controls and firmware over-the-air updates.",
    expected: "hardware",
  },
  {
    id: "other-1",
    text: "A consulting service helping founders clarify product priorities through workshops.",
    expected: "other",
  },
  {
    id: "other-2",
    text: "An educational newsletter focused on startup lessons and leadership stories.",
    projectTypeHint: "other",
    expected: "other",
  },
  {
    id: "other-3",
    text: "Community mentorship program for students exploring entrepreneurship.",
    expected: "other",
  },
];
