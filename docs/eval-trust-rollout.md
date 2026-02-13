# Evaluation Trust Rollout

## Objective
Ship committee evaluations that are measurably more reliable than single-model output by enforcing:
- evidence-grounded claims
- verifier quality gate
- confidence metadata

## Phased Rollout

### Phase 1: Shadow Mode
- Compute trust metadata (`meta`, `evidence`, verifier outcome) in production.
- Do not block responses based on verifier.
- Track metrics silently.

### Phase 2: 10% Exposure
- Enable UI trust panel for 10% of traffic.
- Monitor:
  - `fallbackUsed` rate
  - verifier fail rates
  - latency p95

### Phase 3: 50% Exposure + Gating
- Enable confidence caps when grounding sources are unavailable.
- Start using verifier outcomes to degrade confidence and add reliability notes.

### Phase 4: 100% Exposure
- Keep evidence panel and trust metadata always on.
- Deprecate ungated path after 7 consecutive healthy days.

## Acceptance Thresholds
- Factual error rate reduction: `>= 30%` vs baseline.
- Evidence coverage for factual claims: `>= 80%`.
- Blind human preference: `>= 60%` for committee reports.
- Latency p95: `<= 30s`.

## Operational Metrics to Store
- `meta.confidenceLevel`
- `meta.evidenceCoverage`
- `meta.debateDisagreementIndex`
- `meta.verifierStatus`
- `meta.fallbackUsed`
- end-to-end latency

## Model Routing Env Vars
- `EVAL_MODEL_BEAR` (default `gpt-4o-mini`)
- `EVAL_MODEL_BULL` (default `gpt-4o-mini`)
- `EVAL_MODEL_COMPETITIVE` (default `gpt-5.2`)
- `EVAL_MODEL_JUDGE` (default `gpt-5.2`)
- `EVAL_MODEL_JUDGE_FALLBACK` (default `gpt-4o-mini`)
- `EVAL_MODEL_VERIFIER` (default `gpt-4o-mini`)

## Benchmark Workflow
Use `scripts/eval-committee-benchmark.ts` for periodic committee-vs-baseline comparisons on a fixed scenario set.
