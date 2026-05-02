"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@database/client";
import { users } from "@database/schema";
import { eq } from "drizzle-orm";
import { auth } from "@backend/auth/config";
import { logger } from "@backend/utils/logger";
import type { Role } from "@database/schema";
import { actionError, actionSuccess, type ActionResult } from "@shared/action-result";

/** Updates a user's role from the admin users panel. */
export async function updateUserRole(userId: number, role: Role): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");
  if (session.user.role !== "admin") return actionError("Forbidden");

  try {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  } catch (err) {
    logger.error("Failed to update user role", { userId, role, error: String(err) });
    return actionError("Failed to update role. Please try again.");
  }

  revalidatePath("/admin/users");
  return actionSuccess();
}

/** Deletes a user from the admin users panel, except the current user. */
export async function deleteUser(userId: number): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");
  if (session.user.role !== "admin") return actionError("Forbidden");
  if (String(userId) === session.user.id) return actionError("Cannot delete yourself");

  try {
    await db.delete(users).where(eq(users.id, userId));
  } catch (err) {
    logger.error("Failed to delete user", { userId, error: String(err) });
    return actionError("Failed to delete user. Please try again.");
  }

  revalidatePath("/admin/users");
  return actionSuccess();
}

/** Creates a user from the admin users panel. */
export async function adminCreateUser(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
  department?: string;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");
  if (session.user.role !== "admin") return actionError("Forbidden");

  const passwordHash = await bcrypt.hash(data.password, 10);

  try {
    await db.insert(users).values({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      department: data.department || null,
    });
  } catch (err) {
    logger.error("Failed to create user via admin", { email: data.email, error: String(err) });
    return actionError("Failed to create user. Email may already be in use.");
  }

  revalidatePath("/admin/users");
  return actionSuccess();
}
