import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = process.env;

describe("evaluation model routing", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("uses hard-pinned defaults when env vars are missing", async () => {
    process.env = { ...originalEnv };
    delete process.env.EVAL_MODEL_BEAR;
    delete process.env.EVAL_MODEL_BULL;
    delete process.env.EVAL_MODEL_COMPETITIVE;
    delete process.env.EVAL_MODEL_JUDGE;
    delete process.env.EVAL_MODEL_JUDGE_FALLBACK;

    const { getEvaluationModelMap } = await import("@/lib/ai/model-routing");
    const modelMap = getEvaluationModelMap();

    expect(modelMap.bear).toBe("gpt-4o-mini");
    expect(modelMap.bull).toBe("gpt-4o-mini");
    expect(modelMap.competitive).toBe("gpt-5.2");
    expect(modelMap.judge).toBe("gpt-5.2");
    expect(modelMap.judgeFallback).toBe("gpt-4o-mini");
  });

  it("uses explicit per-agent env overrides", async () => {
    process.env = {
      ...originalEnv,
      EVAL_MODEL_BEAR: "gpt-4.1-mini",
      EVAL_MODEL_BULL: "gpt-4.1-mini",
      EVAL_MODEL_COMPETITIVE: "gpt-5-mini",
      EVAL_MODEL_JUDGE: "gpt-5.2",
      EVAL_MODEL_JUDGE_FALLBACK: "gpt-4o-mini",
      EVAL_MODEL_VERIFIER: "gpt-4o-mini",
    };

    const { getEvaluationModelMap } = await import("@/lib/ai/model-routing");
    const modelMap = getEvaluationModelMap();

    expect(modelMap.bear).toBe("gpt-4.1-mini");
    expect(modelMap.bull).toBe("gpt-4.1-mini");
    expect(modelMap.competitive).toBe("gpt-5-mini");
    expect(modelMap.judge).toBe("gpt-5.2");
    expect(modelMap.judgeFallback).toBe("gpt-4o-mini");
    expect(modelMap.verifier).toBe("gpt-4o-mini");
  });
});
