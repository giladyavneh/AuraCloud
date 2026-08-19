import { describe, expect, it } from "vitest";
import { INTERNAL_AWS_USER_ARNS, excludingInternalArns } from "./consts.js";

describe("excludingInternalArns", () => {
  it("excludes internal identities with no caller filter", () => {
    expect(excludingInternalArns()).toEqual({ arn: { $nin: INTERNAL_AWS_USER_ARNS } });
  });

  it("keeps the caller's own filters alongside the exclusion", () => {
    expect(excludingInternalArns({ resourceType: "S3Bucket" })).toEqual({
      resourceType: "S3Bucket",
      arn: { $nin: INTERNAL_AWS_USER_ARNS },
    });
  });

  it("cannot have the exclusion overridden by a caller filter", () => {
    expect(excludingInternalArns({ arn: "anything" })).toEqual({
      arn: { $nin: INTERNAL_AWS_USER_ARNS },
    });
  });
});
