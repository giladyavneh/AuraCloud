import { describe, expect, it } from "vitest";
import type { Palette } from "@mui/material/styles";
import {
  getActionDotColor,
  groupBlockedActionsByCause,
} from "@/components/resourceCard/helpers/resourceCard.helpers";

const palette = {
  success: { main: "green" },
  error: { main: "red" },
  warning: { main: "amber" },
  divider: "divider",
  border: { strong: "border" },
  text: { disabled: "grey" },
} as unknown as Palette;

describe("getActionDotColor", () => {
  it("colours each action by its own verdict on a resolved resource", () => {
    expect(getActionDotColor(palette, "blocked", "valid")).toBe("green");
    expect(getActionDotColor(palette, "blocked", "error")).toBe("red");
    expect(getActionDotColor(palette, "healthy", "valid")).toBe("green");
  });

  it("overrides every action when the resource verdict cannot be trusted", () => {
    expect(getActionDotColor(palette, "stale", "valid")).toBe("amber");
    expect(getActionDotColor(palette, "stale", "error")).toBe("amber");
    expect(getActionDotColor(palette, "unscanned", "valid")).toBe("grey");
  });

  it("greys an action the Brain never reported on", () => {
    expect(getActionDotColor(palette, "blocked", undefined)).toBe("grey");
  });
});

describe("groupBlockedActionsByCause", () => {
  it("collapses actions denied by the same policy into one cause", () => {
    const causes = groupBlockedActionsByCause([
      { name: "s3:PutObject", status: "error", reason: "Explicit Deny (SalesDenyWrite)" },
      { name: "s3:GetObject", status: "valid" },
      { name: "s3:DeleteObject", status: "error", reason: "Explicit Deny (SalesDenyWrite)" },
      { name: "s3:ListBucket", status: "error", reason: "No matching Allow statement" },
    ]);

    expect(causes).toEqual([
      {
        reason: "Explicit Deny (SalesDenyWrite)",
        actionNames: ["s3:PutObject", "s3:DeleteObject"],
      },
      { reason: "No matching Allow statement", actionNames: ["s3:ListBucket"] },
    ]);
  });

  it("keeps causes in the order they were first seen", () => {
    const causes = groupBlockedActionsByCause([
      { name: "a", status: "error", reason: "second-seen" },
      { name: "b", status: "error", reason: "first-seen" },
      { name: "c", status: "error", reason: "second-seen" },
    ]);

    expect(causes.map(({ reason }) => reason)).toEqual(["second-seen", "first-seen"]);
  });

  it("ignores actions that are not blocked", () => {
    expect(
      groupBlockedActionsByCause([{ name: "a", status: "valid" }, { name: "b" }]),
    ).toEqual([]);
  });
});
