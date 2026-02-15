import {
  mapDomainToRubricProfile,
  mapProjectTypeHintToDomain,
  type ProjectDomain,
} from "@/lib/ai/domain-classifier";

export type CommitteeRole = "bear" | "bull" | "judge";

export interface AgentRoleDefinition {
  role: CommitteeRole;
  title: string;
  primaryDimensions: string[];
  weight: number;
  objective: string;
  instructions: string[];
}

export const COMMITTEE_ROLES: Record<CommitteeRole, AgentRoleDefinition> = {
  bear: {
    role: "bear",
    title: "Adversarial Critic + Technical Risk Assessor",
    primaryDimensions: [
      "technicalFeasibility",
      "failureModes",
      "competitiveThreats",
      "regulatoryRisk",
    ],
    weight: 0.3,
    objective:
      "Stress test the downside and identify specific failure paths that could kill the thesis.",
    instructions: [
      "Prioritize falsification: what makes this idea fail in real deployment?",
      "Use concrete failure modes, not generic risk statements.",
      "Assign lower scores when assumptions are unproven or security posture is weak.",
    ],
  },
  bull: {
    role: "bull",
    title: "Market Opportunity + Growth Analyst",
    primaryDimensions: [
      "marketOpportunity",
      "growthTrajectory",
      "customerDemand",
      "timingWindow",
    ],
    weight: 0.3,
    objective:
      "Find where outsized upside exists and what conditions would unlock durable growth.",
    instructions: [
      "Prioritize evidence-backed upside, not narrative-only optimism.",
      "Explain why demand can materialize despite competition.",
      "Assign higher scores only when wedge and expansion paths are explicit.",
    ],
  },
  judge: {
    role: "judge",
    title: "Calibration Synthesizer + Decision Maker",
    primaryDimensions: [
      "scoreCalibration",
      "crossValidation",
      "uncertaintyHandling",
      "finalComposition",
    ],
    weight: 0.4,
    objective:
      "Calibrate and synthesize committee outputs into a coherent, evidence-weighted final decision.",
    instructions: [
      "Do not re-run full analysis; reconcile bear/bull with rubric anchors.",
      "Highlight disagreements and reduce confidence when evidence is thin.",
      "Show explicit composition math for final score.",
    ],
  },
};

export const COMMITTEE_WEIGHT_CONFIG = {
  bear: COMMITTEE_ROLES.bear.weight,
  bull: COMMITTEE_ROLES.bull.weight,
  judge: COMMITTEE_ROLES.judge.weight,
} as const;

export function getRoleDimensionOverlap(
  left: CommitteeRole,
  right: CommitteeRole
): { shared: string[]; overlapRatio: number } {
  const leftSet = new Set(COMMITTEE_ROLES[left].primaryDimensions);
  const rightSet = new Set(COMMITTEE_ROLES[right].primaryDimensions);
  const shared = Array.from(leftSet).filter((dimension) => rightSet.has(dimension));
  const denominator = Math.max(leftSet.size, rightSet.size, 1);
  return {
    shared,
    overlapRatio: shared.length / denominator,
  };
}

function formatProjectType(projectType: string): string {
  return projectType.trim().toLowerCase();
}

function resolveDomain(projectType: string, classifiedDomain?: ProjectDomain): ProjectDomain {
  if (classifiedDomain) return classifiedDomain;
  return mapProjectTypeHintToDomain(projectType);
}

function domainRoleAddendum(role: CommitteeRole, domain: ProjectDomain): string {
  if (domain === "crypto_defi") {
    if (role === "bear") {
      return "Domain emphasis (DeFi): liquidation mechanics, oracle risk, governance attack surface.";
    }
    if (role === "bull") {
      return "Domain emphasis (DeFi): fee capture path, liquidity bootstrapping, repeat usage behavior.";
    }
    return "Domain emphasis (DeFi): calibrate around security realism and sustainable yield assumptions.";
  }

  if (domain === "memecoin") {
    if (role === "bear") {
      return "Domain emphasis (Memecoin): rug vectors, holder concentration, distribution fragility.";
    }
    if (role === "bull") {
      return "Domain emphasis (Memecoin): narrative timing, distribution loops, community retention.";
    }
    return "Domain emphasis (Memecoin): calibrate narrative upside against concentration and trust risk.";
  }

  if (domain === "ai_ml") {
    if (role === "bear") {
      return "Domain emphasis (AI): wrapper risk, model commoditization, integration complexity.";
    }
    if (role === "bull") {
      return "Domain emphasis (AI): proprietary data loops, distribution compounding, defensibility.";
    }
    return "Domain emphasis (AI): calibrate opportunity against moat durability and execution realism.";
  }

  if (domain === "saas") {
    if (role === "bear") {
      return "Domain emphasis (SaaS): churn sensitivity, weak ICP risk, and CAC/LTV breakpoints.";
    }
    if (role === "bull") {
      return "Domain emphasis (SaaS): expansion revenue, retention loops, and distribution compounding.";
    }
    return "Domain emphasis (SaaS): calibrate growth claims against retention and payback discipline.";
  }

  if (domain === "consumer") {
    if (role === "bear") {
      return "Domain emphasis (Consumer): retention fragility, distribution dependency, and engagement decay.";
    }
    if (role === "bull") {
      return "Domain emphasis (Consumer): habit loops, social growth vectors, and creator/community pull.";
    }
    return "Domain emphasis (Consumer): calibrate upside with realistic retention and acquisition efficiency.";
  }

  if (domain === "hardware") {
    if (role === "bear") {
      return "Domain emphasis (Hardware): manufacturing risk, BOM pressure, and supply-chain fragility.";
    }
    if (role === "bull") {
      return "Domain emphasis (Hardware): defensible product differentiation and distribution channel leverage.";
    }
    return "Domain emphasis (Hardware): calibrate upside against build cycles and operational execution risk.";
  }

  return "Domain emphasis: apply role lens while staying evidence-constrained.";
}

const DOMAIN_DIMENSION_OVERLAYS: Record<ProjectDomain, Partial<Record<CommitteeRole, string[]>>> = {
  crypto_defi: {
    bear: ["smartContractSecurity", "tokenomicsRisk"],
    bull: ["valueAccrualDesign", "liquidityStrategy"],
    judge: ["securityAdjustedCalibration"],
  },
  memecoin: {
    bear: ["holderConcentration", "rugPullVectors"],
    bull: ["narrativeMomentum", "communityDistribution"],
    judge: ["narrativeVsRiskCalibration"],
  },
  ai_ml: {
    bear: ["modelCommoditizationRisk", "integrationComplexity"],
    bull: ["dataMoatStrength", "distributionCompounding"],
    judge: ["moatDurabilityCalibration"],
  },
  saas: {
    bear: ["churnRisk", "cacPaybackRisk"],
    bull: ["unitEconomicsUpside", "expansionRevenue"],
    judge: ["unitEconomicsCalibration"],
  },
  consumer: {
    bear: ["retentionRisk", "distributionFragility"],
    bull: ["engagementLoops", "viralAcquisition"],
    judge: ["retentionAdjustedCalibration"],
  },
  hardware: {
    bear: ["manufacturingRisk", "supplyChainRisk"],
    bull: ["hardwareDifferentiation", "channelLeverage"],
    judge: ["operationalRiskCalibration"],
  },
  other: {},
};

function mergeDimensions(base: string[], overlay: string[]): string[] {
  const merged = [...base];
  for (const dimension of overlay) {
    if (!merged.includes(dimension)) merged.push(dimension);
  }
  return merged;
}

export function getRoleDimensions(
  role: CommitteeRole,
  projectType: string,
  classifiedDomain?: ProjectDomain
): string[] {
  const domain = resolveDomain(projectType, classifiedDomain);
  const baseDimensions = COMMITTEE_ROLES[role].primaryDimensions;
  const overlay = DOMAIN_DIMENSION_OVERLAYS[domain]?.[role] || [];
  return mergeDimensions(baseDimensions, overlay);
}

export function buildRoleSpecializationBlock(
  role: CommitteeRole,
  projectType: string,
  classifiedDomain?: ProjectDomain
): string {
  const domain = resolveDomain(projectType, classifiedDomain);
  const definition = COMMITTEE_ROLES[role];
  const dimensions = getRoleDimensions(role, projectType, classifiedDomain).join(", ");
  const instructions = definition.instructions.map((item, index) => `${index + 1}. ${item}`).join("\n");
  const rubricProfile = mapDomainToRubricProfile(domain);
  const normalizedProjectType = formatProjectType(projectType || "other");

  return `ROLE SPECIALIZATION:
Role: ${definition.title}
Objective: ${definition.objective}
Primary dimensions: ${dimensions}
Weight in committee aggregation: ${definition.weight}
Domain routing: classifier=${domain}, projectType=${normalizedProjectType}, rubricProfile=${rubricProfile}
${domainRoleAddendum(role, domain)}

Execution instructions:
${instructions}`;
}
