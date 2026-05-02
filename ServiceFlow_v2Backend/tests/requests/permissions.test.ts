import { describe, expect, it } from "vitest";
import { canManageRequest } from "@backend/features/requests/permissions";

describe("request permissions", () => {
  it("allows admins to manage any request", () => {
    expect(canManageRequest({ role: "admin", requestOwnerId: 10, currentUserId: "3" })).toBe(true);
  });

  it("allows owners to manage their own requests", () => {
    expect(canManageRequest({ role: "user", requestOwnerId: 10, currentUserId: "10" })).toBe(true);
  });

  it("blocks non-owner users", () => {
    expect(canManageRequest({ role: "user", requestOwnerId: 10, currentUserId: "11" })).toBe(false);
  });
});
