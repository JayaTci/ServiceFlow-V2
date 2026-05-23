import { describe, expect, it } from "vitest";
import { canDeleteRequest, canEditRequest, canViewRequest } from "@backend/features/requests/permissions";
import { canAssignRole, canManageRole, isAdminRole } from "@backend/auth/rbac";

describe("request permissions", () => {
  it("allows admins to view any request", () => {
    expect(canViewRequest({ role: "admin", requestOwnerId: 10, currentUserId: "3" })).toBe(true);
  });

  it("blocks non-owner users from viewing others' requests", () => {
    expect(canViewRequest({ role: "user", requestOwnerId: 10, currentUserId: "11" })).toBe(false);
  });

  it("allows admins to edit any request", () => {
    expect(canEditRequest({ role: "admin", requestOwnerId: 10, currentUserId: "3" })).toBe(true);
  });

  it("allows superadmins to delete requests", () => {
    expect(canDeleteRequest("superadmin")).toBe(true);
  });

  it("allows owners to edit their own requests", () => {
    expect(canEditRequest({ role: "user", requestOwnerId: 10, currentUserId: "10" })).toBe(true);
  });

  it("blocks non-owner users from editing others' requests", () => {
    expect(canEditRequest({ role: "user", requestOwnerId: 10, currentUserId: "11" })).toBe(false);
  });

  it("blocks normal users from deleting requests", () => {
    expect(canDeleteRequest("user")).toBe(false);
  });
});

describe("role hierarchy", () => {
  it("treats admins and superadmins as elevated roles", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("superadmin")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
  });

  it("allows admins to manage only user accounts", () => {
    expect(canManageRole("admin", "user")).toBe(true);
    expect(canManageRole("admin", "admin")).toBe(false);
  });

  it("allows superadmins to manage admins but not peer superadmins", () => {
    expect(canManageRole("superadmin", "admin")).toBe(true);
    expect(canManageRole("superadmin", "superadmin")).toBe(false);
  });

  it("blocks admins from assigning admin role", () => {
    expect(canAssignRole("admin", "admin")).toBe(false);
    expect(canAssignRole("admin", "user")).toBe(true);
  });
});
