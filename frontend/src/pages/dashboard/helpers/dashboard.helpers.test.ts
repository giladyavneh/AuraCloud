import { describe, expect, it } from "vitest";
import { deriveStatusMessage } from "@/pages/dashboard/helpers/dashboard.helpers";
import englishTranslations from "@/i18n/locales/en.json";

const baseInput = {
  isLoading: false,
  monitoredCount: 5,
  hasPermissionData: true,
  blockedCount: 0,
  staleCount: 0,
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
      { ...baseInput, hasPermissionData: false },
    ];

    for (const input of unmeasurable) {
      expect(deriveStatusMessage(input).headingKey).not.toBe("dashboard.healthHeading.healthy");
    }
  });

  it("distinguishes an empty watchlist from an unscanned one", () => {
    expect(deriveStatusMessage({ ...baseInput, monitoredCount: 0 }).headingKey).toBe(
      "dashboard.healthHeading.nothingMonitored",
    );
    expect(deriveStatusMessage({ ...baseInput, hasPermissionData: false }).headingKey).toBe(
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
      { ...baseInput, hasPermissionData: false },
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
});
