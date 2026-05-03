import { desc, inArray } from "drizzle-orm";
import { db } from "@database/client";
import { accountAuditEvents, users } from "@database/schema";
import type { AccountAuditEventWithUsers } from "@shared/types";

/**
 * Fetches the most recent account-management audit events.
 */
export async function getRecentAccountAuditEvents(
  limit = 100
): Promise<AccountAuditEventWithUsers[]> {
  const events = await db
    .select()
    .from(accountAuditEvents)
    .orderBy(desc(accountAuditEvents.createdAt))
    .limit(limit);

  if (events.length === 0) {
    return [];
  }

  const userIds = Array.from(
    new Set(events.flatMap((event) => [event.actorId, event.targetUserId]))
  );

  const relatedUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(inArray(users.id, userIds));

  const userMap = new Map(relatedUsers.map((user) => [user.id, user]));

  return events.flatMap((event) => {
    const actor = userMap.get(event.actorId);
    const targetUser = userMap.get(event.targetUserId);

    if (!actor || !targetUser) {
      return [];
    }

    return [
      {
        ...event,
        actor: {
          id: actor.id,
          name: actor.name,
          email: actor.email,
        },
        targetUser: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        },
      },
    ];
  });
}
