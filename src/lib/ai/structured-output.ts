import type { StructuredSubScore } from "@/lib/ideaEvaluationTypes";

export interface StructuredOutputExtraction {
  parsed: boolean;
  subScores: Record<string, StructuredSubScore>;
  compositionFormula?: string;
  confidenceLevel?: "HIGH" | "MEDIUM" | "LOW";
  groundingCitations: string[];
  warnings: string[];
}

const SECTION_HEADER_REGEX = /^\s*##\s+([^\n]+)\s*$/gim;
const CITATION_REGEX = /\[(MARKET_SNAPSHOT|TOKEN_SECURITY|COMPETITIVE_MEMO)\]/gi;

function normalizeSectionName(name: string): string {
  // Remove parentheticals, colons, and dashes from header names to match standard keys
  // e.g. "MARKET OPPORTUNITY (Sub-score: 3/10)" -> "MARKET OPPORTUNITY"
  return name.replace(/\([^)]*\)|[:\-].*$/g, "").trim().toUpperCase().replace(/\s+/g, " ");
}

function normalizeSubScoreKey(sectionName: string): string {
  const cleaned = sectionName.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim();
  const parts = cleaned.split(/\s+/g).filter(Boolean);
  if (parts.length === 0) return "unknown";
  return parts
    .map((part, index) =>
      index === 0 ? part : `${part.charAt(0).toUpperCase()}${part.slice(1)}`
    )
    .join("");
}

function parseSections(raw: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const matches = Array.from(raw.matchAll(SECTION_HEADER_REGEX));
  if (matches.length === 0) return sections;

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const sectionName = normalizeSectionName(current[1] || "");
    const start = (current.index || 0) + current[0].length;
    const end = next?.index ?? raw.length;
    // Prepend the header itself to the body so parseSubScore can find (Score: X/10) if present in header
    const body = current[0] + "\n" + raw.slice(start, end).trim();
    sections[sectionName] = body;
  }

  return sections;
}

function readLineValue(sectionText: string, label: string): string {
  const regex = new RegExp(`(?:^|\\n)\\s*[-*]?\\s*${label}\\s*:\\s*([^\\n]+)`, "i");
  const match = sectionText.match(regex);
  return match?.[1]?.trim() || "";
}

function parseSubScore(sectionText: string): number | null {
  // Try strictly labeled first: "Sub-score: 7/10"
  const matchStrict = sectionText.match(/(?:sub[- ]?)?score\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*(10|100)/i);
  if (matchStrict) {
    const val = parseFloat(matchStrict[1]);
    const max = parseInt(matchStrict[2]);
    return max === 100 ? val / 10 : val;
  }

  // Try loose format: "7/10" on its own line or at end of line
  const matchLoose = sectionText.match(/(?:^|\n|[\s(])([0-9]+(?:\.[0-9]+)?)\s*\/\s*(10|100)(?:$|\n|[\s)])/);
  if (matchLoose) {
    const val = parseFloat(matchLoose[1]);
    const max = parseInt(matchLoose[2]);
    return max === 100 ? val / 10 : val;
  }

  return null;
}

function parseEvidence(sectionText: string): string[] {
  const explicit = readLineValue(sectionText, "Evidence");
  const sources = explicit
    ? explicit
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean)
    : [];

  const bullets = sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s*\[/.test(line))
    .map((line) => line.replace(/^[-*]\s*/, "").trim());

  const merged = [...sources, ...bullets];
  return Array.from(new Set(merged));
}

function parseGroundingCitations(raw: string): string[] {
  const citations = Array.from(raw.matchAll(CITATION_REGEX)).map((match) =>
    (match[1] || "").toUpperCase()
  );
  return Array.from(new Set(citations));
}

const EXPECTED_SUBSCORE_SECTIONS = [
  "MARKET OPPORTUNITY",
  "TECHNICAL FEASIBILITY",
  "COMPETITIVE MOAT",
  "EXECUTION READINESS",
] as const;

export function extractStructuredOutput(raw: string): StructuredOutputExtraction {
  const warnings: string[] = [];
  const subScores: Record<string, StructuredSubScore> = {};

  if (!raw || !raw.trim()) {
    return {
      parsed: false,
      subScores,
      groundingCitations: [],
      warnings: ["Structured analysis text was empty."],
    };
  }

  // Clean up markdown code blocks if present
  const cleanRaw = raw.replace(/^```markdown\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  const sections = parseSections(cleanRaw);
  const sectionKeys = Object.keys(sections);
  const hasStructuredHeaders = sectionKeys.length > 0;

  if (!hasStructuredHeaders) {
    return {
      parsed: false,
      subScores,
      groundingCitations: parseGroundingCitations(raw),
      warnings: ["No structured section headers detected."],
    };
  }

  for (const sectionName of EXPECTED_SUBSCORE_SECTIONS) {
    const body = sections[sectionName];
    if (!body) {
      warnings.push(`Missing section: ${sectionName}`);
      continue;
    }

    const score = parseSubScore(body);
    if (score === null) {
      warnings.push(`Could not parse sub-score in section: ${sectionName}`);
      continue;
    }

    const reasoning = readLineValue(body, "Reasoning");
    const uncertainty = readLineValue(body, "Uncertainty");
    const evidence = parseEvidence(body);

    subScores[normalizeSubScoreKey(sectionName)] = {
      score,
      evidence,
      reasoning,
      uncertainty,
    };
  }

  // Fallback: Check for a centralized "## SUB-SCORES" or "## SCORES" section
  // Some models (like gpt-4o/mini) prefer to bundle them at the end.
  const subScoreSection = sections['SUB-SCORES'] || sections['SUBSCORES'] || sections['SCORES'];
  if (subScoreSection) {
    const lines = subScoreSection.split('\n');
    for (const line of lines) {
      // match "Technical Feasibility: 8/10" or "Market: 75/100"
      const match = line.match(/([a-zA-Z ]+?)\s*[:=-]\s*([0-9.]+)\s*(\/)?\s*(10|100)?/);
      if (match) {
        const label = match[1].trim();
        const val = parseFloat(match[2]);
        const scale = match[4] ? parseInt(match[4]) : (val > 10 ? 100 : 10);

        // Normalize value to 0-10 scale
        const normalizedScore = scale === 100 ? val / 10 : val;

        // Map label to section key
        let targetKey = "";
        if (label.match(/market/i)) targetKey = "marketOpportunity";
        else if (label.match(/tech/i)) targetKey = "technicalFeasibility";
        else if (label.match(/moat/i)) targetKey = "competitiveMoat";
        else if (label.match(/execution/i)) targetKey = "executionReadiness";

        if (targetKey) {
          if (!subScores[targetKey]) {
            subScores[targetKey] = { score: normalizedScore, evidence: [], reasoning: "Parsed from summary section", uncertainty: "" };
          } else {
            subScores[targetKey].score = normalizedScore;
          }
        }
      }
    }
  }

  const overallSection = sections.OVERALL || "";
  const compositionFormula =
    readLineValue(overallSection, "Composition") ||
    readLineValue(overallSection, "Formula") ||
    undefined;
  const confidenceMatch = overallSection.match(/confidence\s*:\s*(HIGH|MEDIUM|LOW)/i);
  const confidenceLevel = confidenceMatch
    ? (confidenceMatch[1].toUpperCase() as "HIGH" | "MEDIUM" | "LOW")
    : undefined;

  const groundingCitations = parseGroundingCitations(raw);
  if (groundingCitations.length === 0) {
    warnings.push("No grounding citations were detected in structured analysis.");
  }

  const parsed =
    Object.keys(subScores).length > 0 ||
    Boolean(compositionFormula) ||
    Boolean(confidenceLevel) ||
    groundingCitations.length > 0;

  return {
    parsed,
    subScores,
    compositionFormula,
    confidenceLevel,
    groundingCitations,
    warnings,
  };
}
