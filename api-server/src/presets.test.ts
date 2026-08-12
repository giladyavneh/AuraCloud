import { describe, expect, test } from "vitest";
import { mergeResourceLists } from "./presets.js";

describe("mergeResourceLists", () => {
  test("overlapping arns union their actions without duplicating them", () => {
    const result = mergeResourceLists(
      [{ arn: "arn:aws:s3:::bucket", actions: ["GetObject"] }],
      [{ arn: "arn:aws:s3:::bucket", actions: ["PutObject", "GetObject"] }],
    );
    expect(result).toEqual([{ arn: "arn:aws:s3:::bucket", actions: ["GetObject", "PutObject"] }]);
  });

  test("non-overlapping arns are appended, not merged", () => {
    const result = mergeResourceLists(
      [{ arn: "arn:aws:s3:::a", actions: ["GetObject"] }],
      [{ arn: "arn:aws:s3:::b", actions: ["PutObject"] }],
    );
    expect(result).toEqual([
      { arn: "arn:aws:s3:::a", actions: ["GetObject"] },
      { arn: "arn:aws:s3:::b", actions: ["PutObject"] },
    ]);
  });

  test("existing personal entries survive when there is nothing incoming to merge", () => {
    const result = mergeResourceLists(
      [{ arn: "arn:aws:s3:::personal", actions: ["ListBucket"] }],
      [],
    );
    expect(result).toEqual([{ arn: "arn:aws:s3:::personal", actions: ["ListBucket"] }]);
  });

  test("multiple presets fold together: union on a shared arn, append on a new one", () => {
    const teamPreset = [{ arn: "arn:aws:s3:::shared", actions: ["GetObject"] }];
    const individualPreset = [
      { arn: "arn:aws:s3:::shared", actions: ["PutObject"] },
      { arn: "arn:aws:s3:::solo", actions: ["ListBucket"] },
    ];

    const folded = mergeResourceLists(mergeResourceLists([], teamPreset), individualPreset);

    expect(folded).toEqual([
      { arn: "arn:aws:s3:::shared", actions: ["GetObject", "PutObject"] },
      { arn: "arn:aws:s3:::solo", actions: ["ListBucket"] },
    ]);
  });

  test("inputs are never mutated", () => {
    const existing = [{ arn: "arn:aws:s3:::a", actions: ["GetObject"] }];
    const incoming = [{ arn: "arn:aws:s3:::a", actions: ["PutObject"] }];

    mergeResourceLists(existing, incoming);

    expect(existing).toEqual([{ arn: "arn:aws:s3:::a", actions: ["GetObject"] }]);
    expect(incoming).toEqual([{ arn: "arn:aws:s3:::a", actions: ["PutObject"] }]);
  });

  test("an empty incoming actions array is a no-op against an existing arn", () => {
    const result = mergeResourceLists(
      [{ arn: "arn:aws:s3:::bucket", actions: ["GetObject"] }],
      [{ arn: "arn:aws:s3:::bucket", actions: [] }],
    );
    expect(result).toEqual([{ arn: "arn:aws:s3:::bucket", actions: ["GetObject"] }]);
  });

  test("a brand-new arn with empty actions is still appended rather than dropped", () => {
    const result = mergeResourceLists([], [{ arn: "arn:aws:s3:::new-empty", actions: [] }]);
    expect(result).toEqual([{ arn: "arn:aws:s3:::new-empty", actions: [] }]);
  });

  test("duplicate arns within a single incoming list collapse into one row", () => {
    const result = mergeResourceLists(
      [],
      [
        { arn: "arn:aws:s3:::dup", actions: ["GetObject"] },
        { arn: "arn:aws:s3:::dup", actions: ["PutObject", "GetObject"] },
      ],
    );
    expect(result).toEqual([{ arn: "arn:aws:s3:::dup", actions: ["GetObject", "PutObject"] }]);
  });

  // Mirrors applyPresetsToMember's `r.actions ?? []` guard: a resource written straight
  // to Mongo can be missing `actions` entirely, and the normalized shape the caller
  // passes in must behave like an ordinary empty-actions entry.
  test("a resource normalized from a missing actions field merges as empty actions", () => {
    const rawPresetResource = { arn: "arn:aws:s3:::legacy" } as { arn: string; actions?: string[] };
    const normalized = { arn: rawPresetResource.arn, actions: rawPresetResource.actions ?? [] };

    const result = mergeResourceLists([], [normalized]);

    expect(result).toEqual([{ arn: "arn:aws:s3:::legacy", actions: [] }]);
  });
});
