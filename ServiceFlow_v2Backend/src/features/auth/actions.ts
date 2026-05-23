"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, sql, type SQL } from "drizzle-orm";
import { AuthError } from "next-auth";
import { z } from "zod";
import { getAuthFailureMessage, getCurrentUserContext } from "@backend/auth/current-user";
import { signIn, signOut } from "@backend/auth/config";
import { sendEmail } from "@backend/email";
import { passwordResetTemplate } from "@backend/email/templates/password-reset";
import { checkRateLimit, resetRateLimit } from "@backend/security/rate-limit";
import { logger } from "@backend/utils/logger";
import { db } from "@database/client";
import { users } from "@database/schema";
import { actionError, actionSuccess, type ActionResult } from "@shared/action-result";
import { DEPARTMENTS } from "@shared/constants/departments";
import type { RegisterInput } from "@shared/validation/auth";

/** Registers a non-admin user through the internal account creation flow. */
export async function registerUser(data: RegisterInput): Promise<ActionResult> {
  void data;
  return actionError("Public registration is disabled. Ask an admin to create your account.");
}

/** Signs in a user with credentials through Auth.js. */
export async function loginUser(data: { email: string; password: string }): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email: data.email.trim().toLowerCase(),
      password: data.password,
      redirect: false,
    });
    return actionSuccess();
  } catch (error) {
    if (error instanceof AuthError) {
      return actionError("Invalid email or password");
    }
    throw error;
  }
}

/** Ends the current Auth.js session and redirects to login. */
export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * Initiates the password reset flow.
 * Generates a signed token, stores a hash of it in the DB, and emails the reset link.
 * Always returns success to prevent email enumeration.
 */
export async function forgotPassword(email: string): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const normalizedEmail = parsed.data.email.trim().toLowerCase();
  const genericMessage =
    "If an account with that email exists, you'll receive a reset link shortly.";

  const limit = await checkRateLimit({
    scope: "forgot_password",
    identifier: normalizedEmail,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return actionSuccess(undefined, genericMessage);
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, isActive: users.isActive })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (user?.isActive) {
    const rawToken = crypto.randomUUID();
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    try {
      await db
        .update(users)
        .set({
          passwordResetToken: tokenHash,
          passwordResetExpiresAt: expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      const { subject, html } = passwordResetTemplate({
        userName: user.name,
        resetToken: rawToken,
      });

      await sendEmail({ to: user.email, subject, html });
    } catch (err) {
      logger.error("Password reset initiation failed", {
        userId: user.id,
        error: String(err),
      });
    }
  }

  return actionSuccess(undefined, genericMessage);
}

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

/** Validates the reset token and sets the new password. */
export async function resetPassword(token: string, newPassword: string): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({ token, password: newPassword });
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
  const limit = await checkRateLimit({
    scope: "reset_password",
    identifier: tokenHash,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return actionError("Too many reset attempts. Please request a new link.");
  }

  const [user] = await db
    .select({
      id: users.id,
      passwordResetToken: users.passwordResetToken,
      passwordResetExpiresAt: users.passwordResetExpiresAt,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.passwordResetToken, tokenHash))
    .limit(1);

  if (!user) return actionError("Invalid or expired reset link.");
  if (!user.isActive) return actionError("This account is inactive.");

  if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    return actionError("This reset link has expired. Please request a new one.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  try {
    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        mustChangePassword: false,
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  } catch (err) {
    logger.error("Password reset failed", { userId: user.id, error: String(err) });
    return actionError("Failed to update password. Please try again.");
  }

  await resetRateLimit("reset_password", tokenHash);
  return actionSuccess();
}

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    department: z
      .string()
      .nullable()
      .optional()
      .refine((value) => !value || DEPARTMENTS.includes(value as (typeof DEPARTMENTS)[number]), {
        message: "Invalid department",
      }),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(100).optional(),
  })
  .superRefine((value, ctx) => {
    if (Boolean(value.currentPassword) !== Boolean(value.newPassword)) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Current password and new password are both required.",
      });
    }
  });

/** Updates the authenticated user's name, department, and optionally password. */
export async function updateProfile(data: {
  name: string;
  department?: string | null;
  currentPassword?: string;
  newPassword?: string;
}): Promise<ActionResult<{ passwordChanged: boolean }>> {
  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const currentUser = await getCurrentUserContext({ allowMustChangePassword: true });
  if (!currentUser.ok) return actionError(getAuthFailureMessage(currentUser.reason));

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, currentUser.user.id))
    .limit(1);

  if (!user) return actionError("User not found.");

  const updateFields: {
    name: string;
    department: string | null;
    updatedAt: Date;
    passwordHash?: string;
    mustChangePassword?: boolean;
    passwordResetToken?: null;
    passwordResetExpiresAt?: null;
    sessionVersion?: SQL;
  } = {
    name: parsed.data.name.trim(),
    department: parsed.data.department ?? null,
    updatedAt: new Date(),
  };
  let passwordChanged = false;

  if (parsed.data.currentPassword && parsed.data.newPassword) {
    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) return actionError("Current password is incorrect.");
    updateFields.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    updateFields.mustChangePassword = false;
    updateFields.passwordResetToken = null;
    updateFields.passwordResetExpiresAt = null;
    updateFields.sessionVersion = sql`${users.sessionVersion} + 1`;
    passwordChanged = true;
  } else if (currentUser.user.mustChangePassword) {
    return actionError("You must change your password before continuing.");
  }

  try {
    await db.update(users).set(updateFields).where(eq(users.id, currentUser.user.id));
  } catch (err) {
    logger.error("Profile update failed", {
      userId: currentUser.user.id,
      error: String(err),
    });
    return actionError("Failed to save changes. Please try again.");
  }

  return actionSuccess({ passwordChanged });
}
