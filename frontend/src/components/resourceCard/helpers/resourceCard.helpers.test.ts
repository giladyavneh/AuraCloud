import { describe, expect, it } from "vitest";
import type { Palette } from "@mui/material/styles";
import { getActionDotColor } from "@/components/resourceCard/helpers/resourceCard.helpers";

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
