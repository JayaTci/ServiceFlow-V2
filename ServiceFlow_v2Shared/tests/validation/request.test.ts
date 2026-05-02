import { describe, expect, it } from "vitest";
import { createRequestSchema, requestFiltersSchema, updateRequestSchema } from "@shared/validation/request";

describe("request validation", () => {
  it("accepts valid create input", () => {
    const result = createRequestSchema.safeParse({
      title: "Replace broken keyboard",
      description: "The keyboard on workstation A is no longer responding.",
      requestType: "it_support",
      department: "IT",
      dateRequested: "2026-05-03",
      priority: "medium",
    });

    expect(result.success).toBe(true);
  });

  it("requires status for update input", () => {
    const result = updateRequestSchema.safeParse({
      title: "Replace broken keyboard",
      description: "The keyboard on workstation A is no longer responding.",
      requestType: "it_support",
      department: "IT",
      dateRequested: "2026-05-03",
      priority: "medium",
    });

    expect(result.success).toBe(false);
  });

  it("applies filter pagination defaults", () => {
    const result = requestFiltersSchema.parse({ search: "vpn" });

    expect(result).toMatchObject({ search: "vpn", page: 1, pageSize: 10 });
  });
});
