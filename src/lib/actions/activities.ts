"use server";

import { db } from "@/lib/db";
import { requestActivities } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import type { ActivityAction } from "@/lib/db/schema";

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
