import { db } from "@database/client";
import { requestComments, users } from "@database/schema";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { CommentWithAuthor } from "@shared/types";

/**
 * Returns all non-deleted comments for a request, oldest-first
 * so the conversation reads chronologically top-to-bottom.
 */
export async function getCommentsForRequest(requestId: number): Promise<CommentWithAuthor[]> {
  const rows = await db
    .select({
      id: requestComments.id,
      requestId: requestComments.requestId,
      authorId: requestComments.authorId,
      content: requestComments.content,
      createdAt: requestComments.createdAt,
      updatedAt: requestComments.updatedAt,
      deletedAt: requestComments.deletedAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
    })
    .from(requestComments)
    .innerJoin(users, eq(requestComments.authorId, users.id))
    .where(and(eq(requestComments.requestId, requestId), isNull(requestComments.deletedAt)))
    .orderBy(asc(requestComments.createdAt));

  return rows as CommentWithAuthor[];
}
