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

  it("rejects departments outside the canonical list", () => {
    const result = createRequestSchema.safeParse({
      title: "Replace broken keyboard",
      description: "The keyboard on workstation A is no longer responding.",
      requestType: "it_support",
      department: "Engineering",
      dateRequested: "2026-05-03",
      priority: "medium",
    });

    expect(result.success).toBe(false);
  });

  it("caps free-text fields", () => {
    const result = createRequestSchema.safeParse({
      title: "Replace broken keyboard",
      description: "x".repeat(2001),
      requestType: "it_support",
      department: "IT",
      dateRequested: "2026-05-03",
      priority: "medium",
    });

    expect(result.success).toBe(false);
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

  it("rejects oversized page sizes", () => {
    const result = requestFiltersSchema.safeParse({ pageSize: 101 });

    expect(result.success).toBe(false);
  });
});
