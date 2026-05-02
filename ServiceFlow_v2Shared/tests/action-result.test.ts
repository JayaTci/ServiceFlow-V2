import { describe, expect, it } from "vitest";
import { actionError, actionSuccess } from "@shared/action-result";

describe("action results", () => {
  it("builds success responses with optional data", () => {
    expect(actionSuccess({ id: 1 })).toEqual({ success: true, data: { id: 1 } });
  });

  it("builds error responses", () => {
    expect(actionError("Forbidden")).toEqual({ success: false, error: "Forbidden" });
  });
});
