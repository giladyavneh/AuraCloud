// Plain assert-based check for mergeResourceLists (no test framework in this repo).
// Run with: npx tsx src/presets.test.ts

import assert from "node:assert/strict";
import { mergeResourceLists } from "./presets.js";

// Overlapping arns union their actions (dedup, no duplicates)
{
  const result = mergeResourceLists(
    [{ arn: "arn:aws:s3:::bucket", actions: ["GetObject"] }],
    [{ arn: "arn:aws:s3:::bucket", actions: ["PutObject", "GetObject"] }],
  );
  assert.deepEqual(result, [{ arn: "arn:aws:s3:::bucket", actions: ["GetObject", "PutObject"] }]);
}

// Non-overlapping arns are appended, not merged
{
  const result = mergeResourceLists(
    [{ arn: "arn:aws:s3:::a", actions: ["GetObject"] }],
    [{ arn: "arn:aws:s3:::b", actions: ["PutObject"] }],
  );
  assert.deepEqual(result, [
    { arn: "arn:aws:s3:::a", actions: ["GetObject"] },
    { arn: "arn:aws:s3:::b", actions: ["PutObject"] },
  ]);
}

// Existing personal entries survive when there's nothing incoming to merge
{
  const result = mergeResourceLists([{ arn: "arn:aws:s3:::personal", actions: ["ListBucket"] }], []);
  assert.deepEqual(result, [{ arn: "arn:aws:s3:::personal", actions: ["ListBucket"] }]);
}

// Multiple presets fold together: union on shared arn + append on new arn
{
  const teamPreset = [{ arn: "arn:aws:s3:::shared", actions: ["GetObject"] }];
  const individualPreset = [
    { arn: "arn:aws:s3:::shared", actions: ["PutObject"] },
    { arn: "arn:aws:s3:::solo", actions: ["ListBucket"] },
  ];
  const folded = mergeResourceLists(mergeResourceLists([], teamPreset), individualPreset);
  assert.deepEqual(folded, [
    { arn: "arn:aws:s3:::shared", actions: ["GetObject", "PutObject"] },
    { arn: "arn:aws:s3:::solo", actions: ["ListBucket"] },
  ]);
}

// Inputs are never mutated
{
  const existing = [{ arn: "arn:aws:s3:::a", actions: ["GetObject"] }];
  const incoming = [{ arn: "arn:aws:s3:::a", actions: ["PutObject"] }];
  mergeResourceLists(existing, incoming);
  assert.deepEqual(existing, [{ arn: "arn:aws:s3:::a", actions: ["GetObject"] }]);
  assert.deepEqual(incoming, [{ arn: "arn:aws:s3:::a", actions: ["PutObject"] }]);
}

// A preset resource with an empty actions array unions in as a no-op against
// an existing entry for the same arn (nothing added, nothing lost).
{
  const result = mergeResourceLists(
    [{ arn: "arn:aws:s3:::bucket", actions: ["GetObject"] }],
    [{ arn: "arn:aws:s3:::bucket", actions: [] }],
  );
  assert.deepEqual(result, [{ arn: "arn:aws:s3:::bucket", actions: ["GetObject"] }]);
}

// A preset resource with an empty actions array for a brand-new arn is still
// appended (with an empty actions list) rather than dropped.
{
  const result = mergeResourceLists([], [{ arn: "arn:aws:s3:::new-empty", actions: [] }]);
  assert.deepEqual(result, [{ arn: "arn:aws:s3:::new-empty", actions: [] }]);
}

// Duplicate arns *within a single incoming list* (e.g. a preset saved with the
// same arn twice) union together instead of producing two rows for one arn.
{
  const result = mergeResourceLists(
    [],
    [
      { arn: "arn:aws:s3:::dup", actions: ["GetObject"] },
      { arn: "arn:aws:s3:::dup", actions: ["PutObject", "GetObject"] },
    ],
  );
  assert.deepEqual(result, [{ arn: "arn:aws:s3:::dup", actions: ["GetObject", "PutObject"] }]);
}

// Defensive case mirroring applyPresetsToMember's `r.actions ?? []` guard: a
// resource document that bypassed schema validation (e.g. written directly to
// Mongo) and has `actions` missing entirely must not throw when merged — the
// caller is responsible for normalizing to [] before calling in, and that
// normalized shape must behave like an ordinary empty-actions entry.
{
  const rawPresetResource = { arn: "arn:aws:s3:::legacy" } as { arn: string; actions?: string[] };
  const normalized = { arn: rawPresetResource.arn, actions: rawPresetResource.actions ?? [] };
  const result = mergeResourceLists([], [normalized]);
  assert.deepEqual(result, [{ arn: "arn:aws:s3:::legacy", actions: [] }]);
}

console.log("presets.test.ts: all assertions passed");
