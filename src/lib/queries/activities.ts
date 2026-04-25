import { db } from "@/lib/db";
import { requestActivities, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ActivityWithActor } from "@/types";

/**
 * Fetches the full activity timeline for a service request,
 * ordered newest-first (reversed when rendering for a top-down timeline).
 */
export async function getActivitiesForRequest(requestId: number): Promise<ActivityWithActor[]> {
  const rows = await db
    .select({
      id: requestActivities.id,
      requestId: requestActivities.requestId,
      actorId: requestActivities.actorId,
      action: requestActivities.action,
      fieldChanged: requestActivities.fieldChanged,
      oldValue: requestActivities.oldValue,
      newValue: requestActivities.newValue,
      createdAt: requestActivities.createdAt,
      actor: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(requestActivities)
    .innerJoin(users, eq(requestActivities.actorId, users.id))
    .where(eq(requestActivities.requestId, requestId))
    .orderBy(desc(requestActivities.createdAt));

  return rows as ActivityWithActor[];
}

/**
 * Fetches the most recent N activities across all requests (for the admin dashboard feed).
 */
export async function getRecentActivities(limit = 10): Promise<ActivityWithActor[]> {
  const rows = await db
    .select({
      id: requestActivities.id,
      requestId: requestActivities.requestId,
      actorId: requestActivities.actorId,
      action: requestActivities.action,
      fieldChanged: requestActivities.fieldChanged,
      oldValue: requestActivities.oldValue,
      newValue: requestActivities.newValue,
      createdAt: requestActivities.createdAt,
      actor: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(requestActivities)
    .innerJoin(users, eq(requestActivities.actorId, users.id))
    .orderBy(desc(requestActivities.createdAt))
    .limit(limit);

  return rows as ActivityWithActor[];
}
