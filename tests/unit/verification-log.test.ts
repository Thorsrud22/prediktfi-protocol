import { describe, expect, it } from "vitest";
import {
  buildVerificationLogEntry,
  type FailedCheckRecord,
} from "@/lib/ai/verification-log";

describe("verification-log", () => {
  it("produces a complete entry for a clean pass", () => {
    const entry = buildVerificationLogEntry({
      evaluationId: "eval-clean-001",
      checksRun: 5,
      checksFailed: 0,
      repairsUsed: 0,
      fatalFailure: false,
      qualityWarnings: [],
      failedChecks: [],
      durationMs: 12.345,
    });

    expect(entry.evaluationId).toBe("eval-clean-001");
    expect(entry.checksRun).toBe(5);
    expect(entry.checksPassed).toBe(5);
    expect(entry.checksFailed).toBe(0);
    expect(entry.repairsAttempted).toBe(0);
    expect(entry.repairsSucceeded).toBe(0);
    expect(entry.fatalFailure).toBe(false);
    expect(entry.qualityWarnings).toHaveLength(0);
    expect(entry.failedChecks).toHaveLength(0);
    expect(entry.durationMs).toBe(12.35);
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("produces a complete entry with failures and repairs", () => {
    const failedChecks: FailedCheckRecord[] = [
      {
        checkId: "score_justification_alignment",
        severity: "major",
        detail: "Score 92 conflicts with recommendation tone",
        repairAttempted: true,
        repairSucceeded: false,
      },
      {
        checkId: "competitive_not_empty",
        severity: "major",
        detail: "Competitive analysis is empty or trivial",
        repairAttempted: true,
        repairSucceeded: true,
      },
    ];

    const entry = buildVerificationLogEntry({
      evaluationId: "eval-repair-002",
      checksRun: 5,
      checksFailed: 2,
      repairsUsed: 2,
      fatalFailure: false,
      qualityWarnings: ["Score 92 conflicts with recommendation tone"],
      failedChecks,
      durationMs: 847.9123,
    });

    expect(entry.checksPassed).toBe(3);
    expect(entry.checksFailed).toBe(2);
    expect(entry.repairsAttempted).toBe(2);
    expect(entry.repairsSucceeded).toBe(1);
    expect(entry.fatalFailure).toBe(false);
    expect(entry.qualityWarnings).toHaveLength(1);
    expect(entry.failedChecks).toHaveLength(2);
    expect(entry.durationMs).toBe(847.91);
  });

  it("correctly handles a fatal failure", () => {
    const entry = buildVerificationLogEntry({
      evaluationId: "eval-fatal-003",
      checksRun: 2,
      checksFailed: 1,
      repairsUsed: 0,
      fatalFailure: true,
      qualityWarnings: ["Fatal verification failure: Score within valid range"],
      failedChecks: [
        {
          checkId: "score_range",
          severity: "fatal",
          detail: "Score is -5",
          repairAttempted: false,
          repairSucceeded: false,
        },
      ],
      durationMs: 0.42,
    });

    expect(entry.fatalFailure).toBe(true);
    expect(entry.checksPassed).toBe(1);
    expect(entry.checksFailed).toBe(1);
    expect(entry.repairsAttempted).toBe(0);
    expect(entry.failedChecks[0].severity).toBe("fatal");
    expect(entry.failedChecks[0].repairAttempted).toBe(false);
  });

  it("computes repairsSucceeded from failedChecks", () => {
    const entry = buildVerificationLogEntry({
      evaluationId: "eval-partial-004",
      checksRun: 6,
      checksFailed: 3,
      repairsUsed: 3,
      fatalFailure: false,
      qualityWarnings: [],
      failedChecks: [
        { checkId: "a", severity: "major", detail: "", repairAttempted: true, repairSucceeded: true },
        { checkId: "b", severity: "major", detail: "", repairAttempted: true, repairSucceeded: false },
        { checkId: "c", severity: "minor", detail: "", repairAttempted: true, repairSucceeded: false },
      ],
      durationMs: 200,
    });

    expect(entry.repairsAttempted).toBe(3);
    expect(entry.repairsSucceeded).toBe(1);
  });

  it("handles edge case: zero checks run", () => {
    const entry = buildVerificationLogEntry({
      evaluationId: "eval-empty-005",
      checksRun: 0,
      checksFailed: 0,
      repairsUsed: 0,
      fatalFailure: false,
      qualityWarnings: [],
      failedChecks: [],
      durationMs: 0.01,
    });

    expect(entry.checksRun).toBe(0);
    expect(entry.checksPassed).toBe(0);
    expect(entry.durationMs).toBe(0.01);
  });
});
