import { isAdminRole } from "@backend/auth/rbac";
import type { Role } from "@database/schema";

/** Returns whether a user can edit a service request. */
export function canEditRequest({
  role,
  requestOwnerId,
  currentUserId,
}: {
  role: Role;
  requestOwnerId: number;
  currentUserId: string;
}) {
  return isAdminRole(role) || String(requestOwnerId) === currentUserId;
}

/** Returns whether a user can delete a service request. */
export function canDeleteRequest(role: Role) {
  return isAdminRole(role);
}
