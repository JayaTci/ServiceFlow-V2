"use server";

import { logger } from "@backend/utils/logger";
import { db } from "@database/client";
import { accountAuditEvents, type AccountAuditAction } from "@database/schema";

/**
 * Records an account-management action.
 * Failures are logged but must never break the main admin action.
 */
export async function logAccountAuditEvent({
  actorId,
  targetUserId,
  action,
  oldValue,
  newValue,
}: {
  actorId: number;
  targetUserId: number;
  action: AccountAuditAction;
  oldValue?: string;
  newValue?: string;
}) {
  try {
    await db.insert(accountAuditEvents).values({
      actorId,
      targetUserId,
      action,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
    });
  } catch (err) {
    logger.warn("Failed to log account audit event", {
      actorId,
      targetUserId,
      action,
      error: String(err),
    });
  }
}
