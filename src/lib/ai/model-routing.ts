export interface EvaluationModelMap {
  bear: string;
  bull: string;
  competitive: string;
  judge: string;
  judgeFallback: string;
  verifier: string;
}

const DEFAULT_MODEL_MAP: EvaluationModelMap = {
  bear: "gpt-4o-mini",
  bull: "gpt-4o-mini",
  competitive: "gpt-5.2",
  judge: "gpt-5.2",
  judgeFallback: "gpt-4o-mini",
  verifier: "gpt-4o-mini",
};

let didLogModelMap = false;

function readModel(envKey: string, fallback: string): string {
  const value = process.env[envKey];
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function getEvaluationModelMap(): EvaluationModelMap {
  const modelMap: EvaluationModelMap = {
    bear: readModel("EVAL_MODEL_BEAR", DEFAULT_MODEL_MAP.bear),
    bull: readModel("EVAL_MODEL_BULL", DEFAULT_MODEL_MAP.bull),
    competitive: readModel("EVAL_MODEL_COMPETITIVE", DEFAULT_MODEL_MAP.competitive),
    judge: readModel("EVAL_MODEL_JUDGE", DEFAULT_MODEL_MAP.judge),
    judgeFallback: readModel("EVAL_MODEL_JUDGE_FALLBACK", DEFAULT_MODEL_MAP.judgeFallback),
    verifier: readModel("EVAL_MODEL_VERIFIER", DEFAULT_MODEL_MAP.verifier),
  };

  if (!didLogModelMap) {
    didLogModelMap = true;
    console.log(
      "[AI] Evaluation model map",
      JSON.stringify(
        {
          bear: modelMap.bear,
          bull: modelMap.bull,
          competitive: modelMap.competitive,
          judge: modelMap.judge,
          judgeFallback: modelMap.judgeFallback,
          verifier: modelMap.verifier,
        },
        null,
        2
      )
    );
  }

  return modelMap;
}
