"use server";

import { revalidatePath } from "next/cache";
import { db } from "@database/client";
import { requestComments, serviceRequests } from "@database/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@backend/auth/config";
import { logActivity } from "@backend/features/activities/actions";
import { logger } from "@backend/utils/logger";
import { parseUserId } from "@backend/utils/parse-user-id";
import { z } from "zod";
import { actionError, actionSuccess, type ActionResult } from "@shared/action-result";

const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long"),
});

/** Adds a comment to an existing request for the authenticated user. */
export async function createComment(requestId: number, content: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");

  const parsed = commentSchema.safeParse({ content });
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  // Confirm the request exists and is not deleted
  const [request] = await db
    .select({ id: serviceRequests.id })
    .from(serviceRequests)
    .where(and(eq(serviceRequests.id, requestId), isNull(serviceRequests.deletedAt)))
    .limit(1);

  if (!request) return actionError("Request not found");

  const actorId = parseUserId(session.user.id);
  if (actorId === null) return actionError("Unauthorized");

  try {
    await db.insert(requestComments).values({
      requestId,
      authorId: actorId,
      content: parsed.data.content,
    });
  } catch (err) {
    logger.error("Failed to create comment", {
      requestId,
      userId: session.user.id,
      error: String(err),
    });
    return actionError("Failed to add comment. Please try again.");
  }

  // Log activity — non-fatal if it fails
  await logActivity({
    requestId,
    actorId,
    action: "commented",
  });

  revalidatePath(`/requests/${requestId}`);
  return actionSuccess();
}

/** Soft-deletes a comment when the current user is the author or an admin. */
export async function deleteComment(commentId: number): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");

  const [comment] = await db
    .select({ authorId: requestComments.authorId, requestId: requestComments.requestId })
    .from(requestComments)
    .where(and(eq(requestComments.id, commentId), isNull(requestComments.deletedAt)))
    .limit(1);

  if (!comment) return actionError("Comment not found");

  const isAdmin = session.user.role === "admin";
  const isAuthor = String(comment.authorId) === session.user.id;
  if (!isAdmin && !isAuthor) return actionError("Forbidden");

  try {
    await db
      .update(requestComments)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(requestComments.id, commentId));
  } catch (err) {
    logger.error("Failed to delete comment", {
      commentId,
      userId: session.user.id,
      error: String(err),
    });
    return actionError("Failed to delete comment. Please try again.");
  }

  revalidatePath(`/requests/${comment.requestId}`);
  return actionSuccess();
}

/** Updates a comment when the current user is the original author. */
export async function updateComment(commentId: number, content: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");

  const parsed = commentSchema.safeParse({ content });
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const [comment] = await db
    .select({ authorId: requestComments.authorId, requestId: requestComments.requestId })
    .from(requestComments)
    .where(and(eq(requestComments.id, commentId), isNull(requestComments.deletedAt)))
    .limit(1);

  if (!comment) return actionError("Comment not found");

  // Only the original author can edit their comment
  if (String(comment.authorId) !== session.user.id) return actionError("Forbidden");

  try {
    await db
      .update(requestComments)
      .set({ content: parsed.data.content, updatedAt: new Date() })
      .where(eq(requestComments.id, commentId));
  } catch (err) {
    logger.error("Failed to update comment", {
      commentId,
      userId: session.user.id,
      error: String(err),
    });
    return actionError("Failed to update comment. Please try again.");
  }

  revalidatePath(`/requests/${comment.requestId}`);
  return actionSuccess();
}
