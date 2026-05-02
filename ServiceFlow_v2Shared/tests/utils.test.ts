import { describe, expect, it } from "vitest";
import { formatDate, generateRequestCode } from "@shared/utils";

describe("utility helpers", () => {
  it("generates padded yearly request codes", () => {
    expect(generateRequestCode(2026, 7)).toBe("SR-2026-0007");
  });

  it("returns a placeholder for missing dates", () => {
    expect(formatDate(null)).toBe("—");
  });
});
