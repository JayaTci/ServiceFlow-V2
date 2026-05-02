import type { Role } from "@database/schema";

/** Returns whether a user can edit/delete a service request. */
export function canManageRequest({
  role,
  requestOwnerId,
  currentUserId,
}: {
  role: Role;
  requestOwnerId: number;
  currentUserId: string;
}) {
  return role === "admin" || String(requestOwnerId) === currentUserId;
}
