import { describe, expect, it } from "vitest";
import { resolveResourceLabel, splitArnForDisplay } from "@/helpers/arn.helpers";

describe("splitArnForDisplay", () => {
  it("pins the resource itself and leaves the prefix to ellipsise", () => {
    expect(splitArnForDisplay("arn:aws:ec2:eu-north-1:589523296424:instance/i-0da92c89af")).toEqual({
      head: "arn:aws:ec2:eu-north-1:589523296424",
      tail: ":instance/i-0da92c89af",
    });
  });

  it("handles the empty region and account an S3 ARN carries", () => {
    expect(splitArnForDisplay("arn:aws:s3:::aura-cloud-bucket")).toEqual({
      head: "arn:aws:s3::",
      tail: ":aura-cloud-bucket",
    });
  });

  it("keeps a string with no separator whole in the pinned tail", () => {
    expect(splitArnForDisplay("not-an-arn")).toEqual({ head: "", tail: "not-an-arn" });
  });
});

describe("resolveResourceLabel", () => {
  it("prefers the catalogue name", () => {
    expect(resolveResourceLabel("arn:aws:ec2:eu-north-1:123:instance/i-0da", "prod-db-server")).toBe(
      "prod-db-server",
    );
  });

  it("falls back to the ARN tail when the resource has left the catalogue", () => {
    expect(resolveResourceLabel("arn:aws:ec2:eu-north-1:123:instance/i-0da")).toBe(
      "instance/i-0da",
    );
  });
});
