import { describe, expect, it } from "vitest";
import {
  classifyDomain,
  mapDomainToRubricProfile,
  mapProjectTypeHintToDomain,
} from "@/lib/ai/domain-classifier";
import { DOMAIN_CORPUS } from "../fixtures/domain-corpus";

describe("domain-classifier", () => {
  it("maps project type hints to deterministic baseline domains", () => {
    expect(mapProjectTypeHintToDomain("defi")).toBe("crypto_defi");
    expect(mapProjectTypeHintToDomain("memecoin")).toBe("memecoin");
    expect(mapProjectTypeHintToDomain("ai")).toBe("ai_ml");
    expect(mapProjectTypeHintToDomain("nft")).toBe("consumer");
    expect(mapProjectTypeHintToDomain("gaming")).toBe("consumer");
    expect(mapProjectTypeHintToDomain("unknown")).toBe("other");
  });

  it("keeps rubric profile mapping stable for domain-aware prompts", () => {
    expect(mapDomainToRubricProfile("crypto_defi")).toBe("defi");
    expect(mapDomainToRubricProfile("memecoin")).toBe("memecoin");
    expect(mapDomainToRubricProfile("ai_ml")).toBe("ai");
    expect(mapDomainToRubricProfile("saas")).toBe("saas");
    expect(mapDomainToRubricProfile("consumer")).toBe("consumer");
    expect(mapDomainToRubricProfile("hardware")).toBe("generic");
    expect(mapDomainToRubricProfile("other")).toBe("generic");
  });

  it("classifies benchmark corpus with >=85% accuracy", () => {
    let matches = 0;
    for (const entry of DOMAIN_CORPUS) {
      const output = classifyDomain(entry.text, entry.projectTypeHint);
      if (output.domain === entry.expected) matches += 1;
    }

    const accuracy = matches / DOMAIN_CORPUS.length;
    expect(accuracy).toBeGreaterThanOrEqual(0.85);
  });

  it("falls back to 'other' for ambiguous text without signals", () => {
    const output = classifyDomain("Founders helping founders.", "other");
    expect(output.domain).toBe("other");
  });

  it("uses project type hint when text is sparse", () => {
    const output = classifyDomain("Utility token", "defi");
    expect(output.domain).toBe("crypto_defi");
  });
});
