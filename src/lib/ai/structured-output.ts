import type { StructuredSubScore } from "@/lib/ideaEvaluationTypes";

export interface StructuredOutputExtraction {
  parsed: boolean;
  subScores: Record<string, StructuredSubScore>;
  compositionFormula?: string;
  confidenceLevel?: "HIGH" | "MEDIUM" | "LOW";
  groundingCitations: string[];
  warnings: string[];
}

const SECTION_HEADER_REGEX = /^##\s+([^\n]+)\s*$/gim;
const CITATION_REGEX = /\[(MARKET_SNAPSHOT|TOKEN_SECURITY|COMPETITIVE_MEMO)\]/gi;

function normalizeSectionName(name: string): string {
  return name.trim().toUpperCase().replace(/\s+/g, " ");
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
    const body = raw.slice(start, end).trim();
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
  const match = sectionText.match(/sub[- ]?score\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*10/i);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(10, value));
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

  const sections = parseSections(raw);
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
