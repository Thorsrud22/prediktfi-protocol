# PrediktFi Benchmark Suite

This suite defines 18 "Gold Standard" test cases to ensure the scoring engine behaves deterministically. For each case, we define the inputs and the **Critical Expectations** (must-have outputs).

## Category: Memecoin (6 Ideas)

### 1. "Doge Killer 9000" (Classic Rug Pattern)
- **Inputs**:
  - Type: `memecoin`
  - Team: `solo`
  - Resources: `['time']` (No budget)
  - Description: "Going to kill Doge. Launching on pump.fun tomorrow. No website yet."
  - Liquidity Plan: "Will burn LP."
- **Expectations**:
  - `overallScore`: < 50
  - `rugPullRisk`: "high" (Solo, no budget, no website, generic plan)
  - `launchReadinessLabel`: "low"
  - **Red Flag**: Should not mention "revolutionary tech".

### 2. "SafeMoon 3.0" (Ponzi Signals)
- **Inputs**:
  - Type: `memecoin`
  - Team: `team_2_5`
  - Resources: `['budget', 'network']`
  - Description: "Guaranteed 100x. 10% tax on sells redistributed to holders. Locked liquidity for 100 years."
  - Liquidity Plan: "Locked on PinkSale."
- **Expectations**:
  - `overallScore`: < 60 (despite budget)
  - `tokenomics.designScore`: < 40 (Tax mechanisms are hated)
  - **Red Flag**: Must flag "tax" or "reflection" as a negative execution/ponzi signal.

### 3. "Based Brett" (High Quality Community Coin)
- **Inputs**:
  - Type: `memecoin`
  - Team: `team_6_plus`
  - Resources: `['budget', 'network', 'skills']`
  - Description: "Art-driven community coin on Base. 10k unique arts generated. Established artist team."
  - Liquidity Plan: "Self-funded pool $50k, burned LP tokens. Multisig for marketing wallet."
- **Expectations**:
  - `overallScore`: > 75
  - `rugPullRisk`: "low" or "medium"
  - `launchReadinessLabel`: "high"
  - **Moat**: Should mention "Community/Art" as primary moat.

### 4. "AI Trader Doge" (Buzzword Salad)
- **Inputs**:
  - Type: `memecoin`
  - Team: `solo`
  - Resources: `['time']`
  - Description: "Doge but with AI trading bot built in. Quantum computing secured."
  - Liquidity Plan: "Marketing wallet 50%."
- **Expectations**:
  - `overallScore`: < 40
  - `technical.feasibilityScore`: < 20 (Nonsense tech claims)
  - **Red Flag**: "Marketing wallet 50%" must trigger Rug Risk High.

### 5. "Fair Launch Cat" (Standard Good Hygiene)
- **Inputs**:
  - Type: `memecoin`
  - Team: `team_2_5`
  - Resources: `['budget']`
  - Description: "Just a cute cat. Fair launch, no team tokens."
  - Liquidity Plan: "100% supply to LP, 100% LP burned."
- **Expectations**:
  - `overallScore`: 60-80 range (Solid but generic)
  - `rugPullRisk`: "low"
  - `tokenomics.tokenNeeded`: true

### 6. "Celebrity Coin X" (Influencer Risk)
- **Inputs**:
  - Type: `memecoin`
  - Team: `solo`
  - Resources: `['network']`
  - Description: "Official coin of [Famous Rapper]. He will tweet it."
  - Liquidity Plan: "He holds 20% for marketing."
- **Expectations**:
  - `overallScore`: < 60
  - `executionRiskLabel`: "high" (Key person risk)
  - **Red Flag**: Must mention "Concentration risk" or "Influencer dependency".

---

## Category: DeFi (6 Ideas)

### 7. "Solo Dex Fork" (Low Effort)
- **Inputs**:
  - Type: `defi`
  - Team: `solo`
  - Resources: `['time']`
  - Description: "Forking Uniswap V2 to a new L2. Adding a governance token."
  - MVP Scope: "Copy paste contracts."
  - Liquidity Plan: "Liquidity mining."
- **Expectations**:
  - `overallScore`: < 50
  - `technical.feasibilityScore`: > 80 (It's easy to fork)
  - `market.marketFitScore`: < 30 (No differentiation)
  - **Constraint**: Solo team + DeFi = Execution Risk Cap.

### 8. "Institutional RWA Platform" (Complex & Serious)
- **Inputs**:
  - Type: `defi`
  - Team: `team_6_plus`
  - Resources: `['budget', 'skills', 'network']`
  - Description: "Tokenizing US Treasury Bills. compliant KYC/AML. Partnered with custodian."
  - MVP Scope: "Legal structure setup + MVP dApp."
  - Liquidity Plan: "Market maker partners."
- **Expectations**:
  - `overallScore`: > 75
  - `cryptoNativeChecks.auditStatus`: "planned" or "required" (Must be mentioned)
  - `execution.complexityLevel`: "high"

### 9. "Yield Ponzi 5000 APY" (Unsustainable)
- **Inputs**:
  - Type: `defi`
  - Team: `team_2_5`
  - Resources: `['budget']`
  - Description: "Staking protocol paying 5000% APY via inflationary token printing."
  - Liquidity Plan: "Users provide exit liquidity."
- **Expectations**:
  - `overallScore`: < 40
  - `tokenomics.designScore`: < 20
  - **Red Flag**: Must mention "Unsustainable" or "Inflationary spiral".

### 10. "Privacy Swap" (Regulatory Risk)
- **Inputs**:
  - Type: `defi`
  - Team: `team_2_5`
  - Resources: `['skills']`
  - Description: "Tornado cash style mixer but optimized for Solana."
  - MVP Scope: "Smart contracts."
- **Expectations**:
  - `market.goToMarketRisks`: Must include "Regulatory" or "Legal".
  - `overallScore`: Capped by legal risk (should not be > 80).

### 11. "No-Token Lending" (Public Good)
- **Inputs**:
  - Type: `defi`
  - Team: `team_2_5`
  - Resources: `['skills', 'budget']`
  - Description: "Efficient lending market. No governance token. Fees go to treasury."
- **Expectations**:
  - `tokenomics.tokenNeeded`: false
  - `overallScore`: > 60 (Should not be penalized for no token if model is solid).

### 12. "Upgradable Admin Wallet" (Security Risk)
- **Inputs**:
  - Type: `defi`
  - Team: `team_2_5`
  - Resources: `['time']`
  - Description: "Lending protocol. Admin can pause and upgrade contracts instantly."
  - MVP Scope: "Contracts deploy."
- **Expectations**:
  - `executionRiskScore`: < 50
  - `cryptoNativeChecks.rugPullRisk`: "high"
  - **Red Flag**: "Admin keys" / "Centralization risk".

---

## Category: AI & Other (6 Ideas)

### 13. "GPT Wrapper App" (Generic)
- **Inputs**:
  - Type: `ai`
  - Team: `solo`
  - Resources: `['time']`
  - Description: "Chat interface for GPT-4. Subscription model."
  - MVP Scope: "Next.js app."
- **Expectations**:
  - `technical.feasibilityScore`: > 90 (Easy)
  - `market.marketFitScore`: < 40 (Saturated)
  - `execution.complexityLevel`: "low"

### 14. "DePIN GPU Network" (Hard Tech)
- **Inputs**:
  - Type: `ai`
  - Team: `team_6_plus`
  - Resources: `['budget', 'skills']`
  - Description: "Decentralized GPU compute network for training LLMs. Custom hardware."
  - MVP Scope: "Testnet with 100 nodes."
- **Expectations**:
  - `execution.complexityLevel`: "high"
  - `overallScore`: Depends on team readiness. If team is strong -> High Score.

### 15. "Vague Idea" (Low Quality Input)
- **Inputs**:
  - Type: `other`
  - Team: `solo`
  - Resources: `['time']`
  - Description: "I have a great idea for a website. It will be big."
  - MVP Scope: "Website."
- **Expectations**:
  - `overallScore`: < 30
  - **Constraint**: Trigger "Vague Description Penalty".

### 16. "Web3 Social Graph" (Network Effects)
- **Inputs**:
  - Type: `other`
  - Team: `team_2_5`
  - Resources: `['skills', 'network']`
  - Description: "On-chain social graph. Own your data. Lens protocol competitor."
  - MVP Scope: "Profile minting."
- **Expectations**:
  - `market.goToMarketRisks`: Mjust mention "User Adoption" or "Bootstrap problem".
  - `tokenomics.tokenNeeded`: true (likely).

### 17. "Crypto Game (AAA)" (Unrealistic)
- **Inputs**:
  - Type: `game`
  - Team: `solo`
  - Resources: `['time']`
  - Description: "Building a GTA 6 competitor on Solana. Open world. 8k graphics."
  - MVP Scope: "Full game."
- **Expectations**:
  - `technical.feasibilityScore`: < 20
  - `executionRiskLabel`: "high" (Solo dev cannot build AAA).

### 18. "On-Chain Poker" (Compliance/Tech)
- **Inputs**:
  - Type: `game` (or `other`)
  - Team: `team_2_5`
  - Resources: `['skills']`
  - Description: "Trustless poker using ZK proofs for shuffling."
  - MVP Scope: "Poker table contract."
- **Expectations**:
  - `technical.feasibilityScore`: Check valid use of ZK.
  - `market.goToMarketRisks`: "Gambling regulations".
