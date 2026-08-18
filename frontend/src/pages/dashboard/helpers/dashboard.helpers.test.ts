import { describe, expect, it } from "vitest";
import { deriveHealthHeading } from "@/pages/dashboard/helpers/dashboard.helpers";

const baseInput = {
  isLoading: false,
  monitoredCount: 5,
  hasPermissionData: true,
  blockedCount: 0,
  staleCount: 0,
};

describe("deriveHealthHeading", () => {
  it("reports healthy only when everything is measured and clean", () => {
    expect(deriveHealthHeading(baseInput).i18nKey).toBe("dashboard.healthHeading.healthy");
  });

  it("never reports healthy while a state is unmeasurable", () => {
    const unmeasurable = [
      { ...baseInput, isLoading: true },
      { ...baseInput, monitoredCount: 0 },
      { ...baseInput, hasPermissionData: false },
    ];

    for (const input of unmeasurable) {
      expect(deriveHealthHeading(input).i18nKey).not.toBe("dashboard.healthHeading.healthy");
    }
  });

  it("distinguishes an empty watchlist from an unscanned one", () => {
    expect(deriveHealthHeading({ ...baseInput, monitoredCount: 0 }).i18nKey).toBe(
      "dashboard.healthHeading.nothingMonitored",
    );
    expect(deriveHealthHeading({ ...baseInput, hasPermissionData: false }).i18nKey).toBe(
      "dashboard.healthHeading.awaitingScan",
    );
  });

  it("lets blockers outrank stale, and names both when both exist", () => {
    expect(deriveHealthHeading({ ...baseInput, blockedCount: 3 })).toEqual({
      i18nKey: "dashboard.healthHeading.degraded",
      values: { count: 3 },
    });
    expect(deriveHealthHeading({ ...baseInput, staleCount: 2 })).toEqual({
      i18nKey: "dashboard.healthHeading.stale",
      values: { count: 2 },
    });
    expect(deriveHealthHeading({ ...baseInput, blockedCount: 3, staleCount: 2 })).toEqual({
      i18nKey: "dashboard.healthHeading.mixed",
      values: { blockers: 3, stale: 2 },
    });
  });
});
