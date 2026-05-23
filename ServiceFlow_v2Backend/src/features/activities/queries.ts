import { db } from "@database/client";
import { requestActivities, serviceRequests, users } from "@database/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { ActivityWithActor } from "@shared/types";

/**
 * Fetches the full activity timeline for a service request,
 * ordered newest-first (reversed when rendering for a top-down timeline).
 */
export async function getActivitiesForRequest(
  requestId: number,
  userId?: string,
  isAdmin?: boolean
): Promise<ActivityWithActor[]> {
  const conditions = [
    eq(requestActivities.requestId, requestId),
    eq(serviceRequests.id, requestActivities.requestId),
    isNull(serviceRequests.deletedAt),
  ];
  if (!isAdmin) {
    const parsedUserId = userId ? Number.parseInt(userId, 10) : NaN;
    conditions.push(eq(serviceRequests.requestedById, Number.isNaN(parsedUserId) ? -1 : parsedUserId));
  }

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
    .innerJoin(serviceRequests, eq(requestActivities.requestId, serviceRequests.id))
    .where(and(...conditions))
    .orderBy(desc(requestActivities.createdAt));

  return rows as ActivityWithActor[];
}

/**
 * Fetches the most recent N activities across all requests (for the admin dashboard feed).
 */
export async function getRecentActivities(
  limit = 10,
  userId?: string,
  isAdmin?: boolean
): Promise<ActivityWithActor[]> {
  const conditions = [isNull(serviceRequests.deletedAt)];
  if (!isAdmin) {
    const parsedUserId = userId ? Number.parseInt(userId, 10) : NaN;
    conditions.push(eq(serviceRequests.requestedById, Number.isNaN(parsedUserId) ? -1 : parsedUserId));
  }

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
    .innerJoin(serviceRequests, eq(requestActivities.requestId, serviceRequests.id))
    .where(and(...conditions))
    .orderBy(desc(requestActivities.createdAt))
    .limit(limit);

  return rows as ActivityWithActor[];
}
