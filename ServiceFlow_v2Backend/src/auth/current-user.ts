import { eq } from "drizzle-orm";
import { auth } from "@backend/auth/config";
import { isAdminRole, isSuperadminRole } from "@backend/auth/rbac";
import { parseUserId } from "@backend/utils/parse-user-id";
import { db } from "@database/client";
import { users, type Role } from "@database/schema";

export type CurrentUserFailureReason =
  | "unauthenticated"
  | "invalid_session"
  | "missing_user"
  | "inactive"
  | "stale_session"
  | "password_change_required";

export type CurrentUserContext = {
  id: number;
  sessionUserId: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  sessionVersion: number;
  isAdmin: boolean;
  isSuperadmin: boolean;
};

export type CurrentUserResult =
  | { ok: true; user: CurrentUserContext }
  | { ok: false; reason: CurrentUserFailureReason };

export function getAuthFailureRedirect(reason: CurrentUserFailureReason) {
  if (reason === "password_change_required") {
    return "/profile?forcePasswordChange=1";
  }

  return "/login";
}

export function getAuthFailureMessage(reason: CurrentUserFailureReason) {
  switch (reason) {
    case "inactive":
      return "Your account is inactive.";
    case "stale_session":
      return "Your session has expired. Please sign in again.";
    case "password_change_required":
      return "You must change your password before continuing.";
    default:
      return "Unauthorized";
  }
}

export async function getCurrentUserContext(options?: {
  allowMustChangePassword?: boolean;
}): Promise<CurrentUserResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, reason: "unauthenticated" };
  }

  const userId = parseUserId(session.user.id);
  if (userId === null) {
    return { ok: false, reason: "invalid_session" };
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      department: users.department,
      isActive: users.isActive,
      mustChangePassword: users.mustChangePassword,
      sessionVersion: users.sessionVersion,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { ok: false, reason: "missing_user" };
  }

  if (!user.isActive) {
    return { ok: false, reason: "inactive" };
  }

  if (typeof session.user.sessionVersion !== "number") {
    return { ok: false, reason: "stale_session" };
  }

  if (session.user.sessionVersion !== user.sessionVersion) {
    return { ok: false, reason: "stale_session" };
  }

  if (user.mustChangePassword && !options?.allowMustChangePassword) {
    return { ok: false, reason: "password_change_required" };
  }

  return {
    ok: true,
    user: {
      ...user,
      sessionUserId: session.user.id,
      isAdmin: isAdminRole(user.role),
      isSuperadmin: isSuperadminRole(user.role),
    },
  };
}
