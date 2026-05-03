"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { canAssignRole, canManageRole, formatRoleLabel } from "@backend/auth/rbac";
import {
  getAuthFailureMessage,
  getCurrentUserContext,
  type CurrentUserContext,
} from "@backend/auth/current-user";
import { logAccountAuditEvent } from "@backend/features/activities/account-audit-actions";
import { logger } from "@backend/utils/logger";
import { db } from "@database/client";
import { users, type Role } from "@database/schema";
import { actionError, actionSuccess, type ActionResult } from "@shared/action-result";

async function getManageableTargetUser(
  userId: number
): Promise<
  | {
      ok: true;
      currentUser: CurrentUserContext;
      targetUser: {
        id: number;
        role: Role;
        isActive: boolean;
        name: string;
        email: string;
      };
    }
  | { ok: false; error: ActionResult }
> {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) {
    return { ok: false, error: actionError(getAuthFailureMessage(currentUser.reason)) };
  }

  if (!currentUser.user.isAdmin) {
    return { ok: false, error: actionError("Forbidden") };
  }

  const [targetUser] = await db
    .select({
      id: users.id,
      role: users.role,
      isActive: users.isActive,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!targetUser) {
    return { ok: false, error: actionError("User not found.") };
  }

  if (!canManageRole(currentUser.user.role, targetUser.role)) {
    return { ok: false, error: actionError("Forbidden") };
  }

  return { ok: true, currentUser: currentUser.user, targetUser };
}

/** Updates a user's role from the admin users panel. */
export async function updateUserRole(userId: number, role: Role): Promise<ActionResult> {
  const target = await getManageableTargetUser(userId);
  if (!target.ok) return target.error;
  if (target.currentUser.id === userId) {
    return actionError("You cannot change your own role.");
  }

  if (!canAssignRole(target.currentUser.role, role)) {
    return actionError("Forbidden");
  }

  try {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  } catch (err) {
    logger.error("Failed to update user role", { userId, role, error: String(err) });
    return actionError("Failed to update role. Please try again.");
  }

  logger.info("User role updated", {
    actorId: target.currentUser.id,
    targetUserId: userId,
    previousRole: target.targetUser.role,
    nextRole: role,
  });
  await logAccountAuditEvent({
    actorId: target.currentUser.id,
    targetUserId: userId,
    action: "role_changed",
    oldValue: target.targetUser.role,
    newValue: role,
  });

  revalidatePath("/admin/users");
  revalidatePath("/profile");
  return actionSuccess();
}

/** Deactivates or reactivates a user account from the admin users panel. */
export async function setUserActive(userId: number, isActive: boolean): Promise<ActionResult> {
  const target = await getManageableTargetUser(userId);
  if (!target.ok) return target.error;
  if (target.currentUser.id === userId) {
    return actionError(`You cannot ${isActive ? "reactivate" : "deactivate"} your own account.`);
  }

  if (target.targetUser.isActive === isActive) {
    return actionSuccess(undefined, `User already ${isActive ? "active" : "inactive"}.`);
  }

  try {
    await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId));
  } catch (err) {
    logger.error("Failed to update user activity state", { userId, isActive, error: String(err) });
    return actionError("Failed to update user access. Please try again.");
  }

  logger.info("User account state updated", {
    actorId: target.currentUser.id,
    targetUserId: userId,
    nextIsActive: isActive,
  });
  await logAccountAuditEvent({
    actorId: target.currentUser.id,
    targetUserId: userId,
    action: isActive ? "reactivated" : "deactivated",
    oldValue: String(target.targetUser.isActive),
    newValue: String(isActive),
  });

  revalidatePath("/admin/users");
  revalidatePath("/profile");
  return actionSuccess(
    undefined,
    isActive ? "User reactivated successfully." : "User deactivated successfully."
  );
}

/** Sets a temporary password and forces the user to change it on the next login. */
export async function setUserTemporaryPassword(
  userId: number,
  password: string
): Promise<ActionResult> {
  const target = await getManageableTargetUser(userId);
  if (!target.ok) return target.error;
  if (target.currentUser.id === userId) {
    return actionError("Use your profile page to change your own password.");
  }

  if (password.trim().length < 8) {
    return actionError("Temporary password must be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  } catch (err) {
    logger.error("Failed to set temporary password", { userId, error: String(err) });
    return actionError("Failed to reset password. Please try again.");
  }

  logger.info("Temporary password set", {
    actorId: target.currentUser.id,
    targetUserId: userId,
  });
  await logAccountAuditEvent({
    actorId: target.currentUser.id,
    targetUserId: userId,
    action: "temporary_password_set",
    newValue: "must_change_password=true",
  });

  revalidatePath("/admin/users");
  revalidatePath("/profile");
  return actionSuccess(undefined, "Temporary password set successfully.");
}

/** Creates a user from the admin users panel. */
export async function adminCreateUser(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  department?: string;
}): Promise<ActionResult> {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) return actionError(getAuthFailureMessage(currentUser.reason));
  if (!currentUser.user.isAdmin) return actionError("Forbidden");
  if (!canAssignRole(currentUser.user.role, data.role)) return actionError("Forbidden");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const email = data.email.trim().toLowerCase();

  try {
    await db.insert(users).values({
      name: data.name.trim(),
      email,
      passwordHash,
      role: data.role,
      department: data.department || null,
      isActive: true,
      mustChangePassword: true,
    });
  } catch (err) {
    logger.error("Failed to create user via admin", { email, error: String(err) });
    return actionError("Failed to create user. Email may already be in use.");
  }

  logger.info("User created via admin panel", {
    actorId: currentUser.user.id,
    email,
    role: data.role,
  });
  const [createdUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (createdUser) {
    await logAccountAuditEvent({
      actorId: currentUser.user.id,
      targetUserId: createdUser.id,
      action: "user_created",
      newValue: `${data.role}:${email}`,
    });
  }

  revalidatePath("/admin/users");
  return actionSuccess(
    undefined,
    `${formatRoleLabel(data.role)} account created with a temporary password.`
  );
}
