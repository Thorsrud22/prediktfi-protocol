import { describe, expect, it } from "vitest";
import { wrapGrounding } from "@/lib/market/types";

describe("wrapGrounding", () => {
  it("marks data stale when staleness exceeds ttl", () => {
    const fetchedAt = new Date(Date.now() - 2 * 3_600_000);
    const envelope = wrapGrounding({ ok: true }, "unit_test", fetchedAt, 1);

    expect(envelope.isStale).toBe(true);
    expect(envelope.stalenessHours).toBeGreaterThan(1.9);
    expect(envelope.ttlHours).toBe(1);
  });

  it("marks data fresh when staleness is within ttl", () => {
    const fetchedAt = new Date(Date.now() - 30 * 60_000);
    const envelope = wrapGrounding({ ok: true }, "unit_test", fetchedAt, 1);

    expect(envelope.isStale).toBe(false);
    expect(envelope.stalenessHours).toBeLessThan(1);
  });
});
