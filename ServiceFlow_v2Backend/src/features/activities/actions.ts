"use server";

import { db } from "@database/client";
import { requestActivities } from "@database/schema";
import { logger } from "@backend/utils/logger";
import type { ActivityAction } from "@database/schema";

/**
 * Records an action on a service request.
 * Called internally from other server actions — not exposed to the client directly.
 * Failures are logged but do NOT throw, so a logging error never breaks the main action.
 */
export async function logActivity({
  requestId,
  actorId,
  action,
  fieldChanged,
  oldValue,
  newValue,
}: {
  requestId: number;
  actorId: number;
  action: ActivityAction;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
}) {
  try {
    await db.insert(requestActivities).values({
      requestId,
      actorId,
      action,
      fieldChanged: fieldChanged ?? null,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
    });
  } catch (err) {
    // Non-fatal: a logging failure must never break the operation that triggered it.
    logger.warn("Failed to log activity", {
      requestId,
      actorId,
      action,
      error: String(err),
    });
  }
}
