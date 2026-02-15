export type CheckSeverity = "fatal" | "major" | "minor" | "cosmetic";

export interface FailedCheckRecord {
  checkId: string;
  severity: CheckSeverity;
  detail: string;
  repairAttempted: boolean;
  repairSucceeded: boolean;
}

export interface VerificationLogEntry {
  evaluationId: string;
  timestamp: string;
  durationMs: number;
  checksRun: number;
  checksPassed: number;
  checksFailed: number;
  repairsAttempted: number;
  repairsSucceeded: number;
  fatalFailure: boolean;
  qualityWarnings: string[];
  failedChecks: FailedCheckRecord[];
}

export function buildVerificationLogEntry(params: {
  evaluationId: string;
  checksRun: number;
  checksFailed: number;
  repairsUsed: number;
  fatalFailure: boolean;
  qualityWarnings: string[];
  failedChecks: FailedCheckRecord[];
  durationMs: number;
}): VerificationLogEntry {
  const repairsSucceeded = params.failedChecks.filter(
    (check) => check.repairAttempted && check.repairSucceeded
  ).length;

  return {
    evaluationId: params.evaluationId,
    timestamp: new Date().toISOString(),
    durationMs: Math.round(params.durationMs * 100) / 100,
    checksRun: params.checksRun,
    checksPassed: Math.max(0, params.checksRun - params.checksFailed),
    checksFailed: params.checksFailed,
    repairsAttempted: params.repairsUsed,
    repairsSucceeded,
    fatalFailure: params.fatalFailure,
    qualityWarnings: params.qualityWarnings,
    failedChecks: params.failedChecks,
  };
}

export function emitVerificationLog(entry: VerificationLogEntry): void {
  if (process.env.NODE_ENV === "test") return;

  console.log(
    JSON.stringify({
      _event: "verification_complete",
      _level: entry.fatalFailure
        ? "error"
        : entry.checksFailed > 0
          ? "warn"
          : "info",
      ...entry,
    })
  );
}
