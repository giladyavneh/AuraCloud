import { describe, expect, it } from "vitest";
import {
  resolveResourceStatus,
  resolveWatchlistStatuses,
  STALE_AFTER_MS,
} from "./resourceStatus.js";

const NOW = Date.parse("2026-08-18T12:00:00.000Z");
const fresh = new Date(NOW - 1_000).toISOString();
const tooOld = new Date(NOW - STALE_AFTER_MS - 1).toISOString();

describe("resolveResourceStatus", () => {
  it("treats an ARN the Brain never reported as unscanned", () => {
    expect(resolveResourceStatus(undefined, NOW)).toBe("unscanned");
    expect(resolveResourceStatus({}, NOW)).toBe("unscanned");
  });

  it("reads valid and error verdicts", () => {
    expect(resolveResourceStatus({ read: { status: "valid", timestamp: fresh } }, NOW)).toBe(
      "healthy",
    );
    expect(resolveResourceStatus({ read: { status: "error", timestamp: fresh } }, NOW)).toBe(
      "blocked",
    );
  });

  it("lets one blocked action outrank its healthy siblings", () => {
    const entry = {
      read: { status: "valid", timestamp: fresh },
      write: { status: "error", timestamp: fresh },
    };
    expect(resolveResourceStatus(entry, NOW)).toBe("blocked");
  });

  it("lets stale outrank blocked", () => {
    expect(resolveResourceStatus({ read: { status: "error", timestamp: tooOld } }, NOW)).toBe(
      "stale",
    );
  });

  it("counts a missing or unparseable timestamp as stale", () => {
    expect(resolveResourceStatus({ read: { status: "valid" } }, NOW)).toBe("stale");
    expect(resolveResourceStatus({ read: { status: "valid", timestamp: "nonsense" } }, NOW)).toBe(
      "stale",
    );
  });

  it("goes stale the instant the threshold is passed, not before", () => {
    const exactlyAtLimit = new Date(NOW - STALE_AFTER_MS).toISOString();
    expect(resolveResourceStatus({ read: { status: "valid", timestamp: exactlyAtLimit } }, NOW)).toBe(
      "healthy",
    );
    expect(resolveResourceStatus({ read: { status: "valid", timestamp: tooOld } }, NOW)).toBe(
      "stale",
    );
  });

  it("accepts a single top-level verdict as well as a per-action map", () => {
    expect(resolveResourceStatus({ status: "error", timestamp: fresh }, NOW)).toBe("blocked");
  });
});

describe("resolveWatchlistStatuses", () => {
  it("covers every watched ARN, including ones absent from the Brain output", () => {
    const statuses = resolveWatchlistStatuses(
      ["arn:watched:reported", "arn:watched:never-reported"],
      { "arn:watched:reported": { read: { status: "valid", timestamp: fresh } } },
      NOW,
    );

    expect(statuses).toEqual({
      "arn:watched:reported": "healthy",
      "arn:watched:never-reported": "unscanned",
    });
  });

  it("ignores Brain output for ARNs that are no longer watched", () => {
    const statuses = resolveWatchlistStatuses(
      [],
      { "arn:unwatched": { read: { status: "error", timestamp: fresh } } },
      NOW,
    );

    expect(statuses).toEqual({});
  });
});
