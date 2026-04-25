import { db } from "@/lib/db";
import { requestComments, users } from "@/lib/db/schema";
import { eq, isNull, asc } from "drizzle-orm";
import type { CommentWithAuthor } from "@/types";

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
    .where(eq(requestComments.requestId, requestId))
    // isNull check done via join — soft-deleted comments are excluded
    .orderBy(asc(requestComments.createdAt));

  // Filter out soft-deleted after the fact (Drizzle doesn't support nullable in join where easily)
  return rows.filter((r) => r.deletedAt === null) as CommentWithAuthor[];
}
