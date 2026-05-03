import type { Role } from "@database/schema";

export function isSuperadminRole(role: Role | string | null | undefined): role is "superadmin" {
  return role === "superadmin";
}

export function isAdminRole(
  role: Role | string | null | undefined
): role is "superadmin" | "admin" {
  return role === "superadmin" || role === "admin";
}

export function canManageRole(actorRole: Role, targetRole: Role) {
  if (actorRole === "superadmin") {
    return targetRole !== "superadmin";
  }

  if (actorRole === "admin") {
    return targetRole === "user";
  }

  return false;
}

export function canAssignRole(actorRole: Role, nextRole: Role) {
  if (actorRole === "superadmin") {
    return nextRole === "admin" || nextRole === "user";
  }

  if (actorRole === "admin") {
    return nextRole === "user";
  }

  return false;
}

export function formatRoleLabel(role: Role) {
  if (role === "superadmin") {
    return "Superadmin";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "User";
}
