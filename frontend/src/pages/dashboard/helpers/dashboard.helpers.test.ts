import { describe, expect, it } from "vitest";
import {
  countResourceStatuses,
  deriveStatusMessage,
  deriveSystemStatus,
  getHealthScoreBand,
  resolveWatchedActions,
} from "@/pages/dashboard/helpers/dashboard.helpers";
import englishTranslations from "@/i18n/locales/en.json";

const baseInput = {
  isLoading: false,
  monitoredCount: 5,
  blockedCount: 0,
  staleCount: 0,
  unscannedCount: 0,
};

/** Accepts the _one/_other pair i18next expands plurals into. */
const isTranslated = (key: string): boolean => {
  const lookUp = (candidate: string): unknown =>
    candidate
      .split(".")
      .reduce<unknown>(
        (branch, segment) =>
          typeof branch === "object" && branch !== null
            ? (branch as Record<string, unknown>)[segment]
            : undefined,
        englishTranslations,
      );

  if (typeof lookUp(key) === "string") return true;
  return typeof lookUp(`${key}_one`) === "string" && typeof lookUp(`${key}_other`) === "string";
};

describe("deriveStatusMessage", () => {
  it("reports healthy only when everything is measured and clean", () => {
    expect(deriveStatusMessage(baseInput).headingKey).toBe("dashboard.healthHeading.healthy");
  });

  it("never reports healthy while a state is unmeasurable", () => {
    const unmeasurable = [
      { ...baseInput, isLoading: true },
      { ...baseInput, monitoredCount: 0 },
      { ...baseInput, unscannedCount: 5 },
    ];

    for (const input of unmeasurable) {
      expect(deriveStatusMessage(input).headingKey).not.toBe("dashboard.healthHeading.healthy");
    }
  });

  it("distinguishes an empty watchlist from an unscanned one", () => {
    expect(deriveStatusMessage({ ...baseInput, monitoredCount: 0 }).headingKey).toBe(
      "dashboard.healthHeading.nothingMonitored",
    );
    expect(deriveStatusMessage({ ...baseInput, unscannedCount: 5 }).headingKey).toBe(
      "dashboard.healthHeading.awaitingScan",
    );
  });

  it("lets blockers outrank stale, and names both when both exist", () => {
    expect(deriveStatusMessage({ ...baseInput, blockedCount: 3 })).toEqual({
      headingKey: "dashboard.healthHeading.degraded",
      headingValues: { count: 3 },
      adviceKey: "dashboard.statusAdvice.degraded",
    });
    expect(deriveStatusMessage({ ...baseInput, staleCount: 2 })).toEqual({
      headingKey: "dashboard.healthHeading.stale",
      headingValues: { count: 2 },
      adviceKey: "dashboard.statusAdvice.stale",
    });
    expect(deriveStatusMessage({ ...baseInput, blockedCount: 3, staleCount: 2 })).toEqual({
      headingKey: "dashboard.healthHeading.mixed",
      headingValues: { blockers: 3, stale: 2 },
      adviceKey: "dashboard.statusAdvice.mixed",
    });
  });

  it("only returns keys that exist in the translation file", () => {
    const everyState = [
      { ...baseInput, isLoading: true },
      { ...baseInput, monitoredCount: 0 },
      { ...baseInput, unscannedCount: 5 },
      { ...baseInput, blockedCount: 3, staleCount: 2 },
      { ...baseInput, blockedCount: 3 },
      { ...baseInput, staleCount: 2 },
      baseInput,
    ];

    for (const input of everyState) {
      const message = deriveStatusMessage(input);
      expect(isTranslated(message.headingKey), message.headingKey).toBe(true);
      expect(isTranslated(message.adviceKey), message.adviceKey).toBe(true);
    }
  });

  it("folds a partial unscanned count into the stale number", () => {
    expect(deriveStatusMessage({ ...baseInput, staleCount: 2, unscannedCount: 1 })).toEqual({
      headingKey: "dashboard.healthHeading.stale",
      headingValues: { count: 3 },
      adviceKey: "dashboard.statusAdvice.stale",
    });
  });
});

describe("countResourceStatuses", () => {
  it("counts an ARN the server did not resolve as unscanned", () => {
    const counts = countResourceStatuses(["arn:a", "arn:b", "arn:c"], {
      "arn:a": "healthy",
      "arn:b": "blocked",
    });

    expect(counts).toEqual({ healthy: 1, blocked: 1, stale: 0, unscanned: 1 });
  });

  it("ignores statuses for ARNs that are not watched", () => {
    expect(countResourceStatuses([], { "arn:unwatched": "blocked" })).toEqual({
      healthy: 0,
      blocked: 0,
      stale: 0,
      unscanned: 0,
    });
  });
});

describe("deriveSystemStatus", () => {
  it("reports degraded when every watched resource has gone stale", () => {
    expect(deriveSystemStatus(false, false, 4, 4).labelKey).toBe(
      "dashboard.systemStatus.degraded",
    );
  });

  it("stays online while some resources are still fresh", () => {
    expect(deriveSystemStatus(false, false, 4, 3)).toEqual({ variant: "online" });
  });

  it("stays online when nothing is monitored", () => {
    expect(deriveSystemStatus(false, false, 0, 0)).toEqual({ variant: "online" });
  });
});

describe("getHealthScoreBand", () => {
  it("holds each band at its own boundary", () => {
    expect(getHealthScoreBand(100)).toBe("good");
    expect(getHealthScoreBand(90)).toBe("good");
    expect(getHealthScoreBand(89)).toBe("fair");
    expect(getHealthScoreBand(60)).toBe("fair");
    expect(getHealthScoreBand(59)).toBe("poor");
    expect(getHealthScoreBand(0)).toBe("poor");
  });
});

describe("resolveWatchedActions", () => {
  // The Brain stores every action under its canonical name AND a camelCase alias.
  const mixedVerdicts = {
    "s3:GetObject": { status: "valid" as const, reason: null, timestamp: "2026-08-19T07:51:25Z" },
    getObject: { status: "valid" as const, reason: null, timestamp: "2026-08-19T07:51:25Z" },
    "s3:PutObject": {
      status: "error" as const,
      reason: "Explicit Deny in identity policy",
      timestamp: "2026-08-19T07:51:25Z",
    },
    putObject: {
      status: "error" as const,
      reason: "Explicit Deny in identity policy",
      timestamp: "2026-08-19T07:51:25Z",
    },
  };

  it("gives each action its own verdict rather than the resource's", () => {
    expect(resolveWatchedActions(["s3:GetObject", "s3:PutObject"], mixedVerdicts)).toEqual([
      { name: "s3:GetObject", status: "valid" },
      { name: "s3:PutObject", status: "error", reason: "Explicit Deny in identity policy" },
    ]);
  });

  it("returns one entry per watched action, never the camelCase aliases", () => {
    const resolved = resolveWatchedActions(["s3:GetObject", "s3:PutObject"], mixedVerdicts);

    expect(resolved).toHaveLength(2);
    expect(resolved.map(({ name }) => name)).not.toContain("getObject");
  });

  it("leaves an action the Brain did not report without a status", () => {
    expect(resolveWatchedActions(["s3:DeleteObject"], mixedVerdicts)).toEqual([
      { name: "s3:DeleteObject" },
    ]);
    expect(resolveWatchedActions(["s3:GetObject"], undefined)).toEqual([{ name: "s3:GetObject" }]);
  });

  it("applies a single top-level verdict to every watched action", () => {
    const topLevel = { status: "error" as const, reason: "denied", timestamp: "2026-08-19T07:51:25Z" };

    expect(resolveWatchedActions(["a", "b"], topLevel)).toEqual([
      { name: "a", status: "error", reason: "denied" },
      { name: "b", status: "error", reason: "denied" },
    ]);
  });
});
