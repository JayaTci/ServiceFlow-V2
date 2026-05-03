"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getAuthFailureMessage, getCurrentUserContext } from "@backend/auth/current-user";
import { isAdminRole } from "@backend/auth/rbac";
import { logActivity } from "@backend/features/activities/actions";
import { logger } from "@backend/utils/logger";
import { db } from "@database/client";
import { requestComments, serviceRequests } from "@database/schema";
import { actionError, actionSuccess, type ActionResult } from "@shared/action-result";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000, "Comment is too long"),
});

/** Adds a comment to an existing request for the authenticated user. */
export async function createComment(requestId: number, content: string): Promise<ActionResult> {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) return actionError(getAuthFailureMessage(currentUser.reason));

  const parsed = commentSchema.safeParse({ content });
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const [request] = await db
    .select({ id: serviceRequests.id })
    .from(serviceRequests)
    .where(and(eq(serviceRequests.id, requestId), isNull(serviceRequests.deletedAt)))
    .limit(1);

  if (!request) return actionError("Request not found");

  try {
    await db.insert(requestComments).values({
      requestId,
      authorId: currentUser.user.id,
      content: parsed.data.content,
    });
  } catch (err) {
    logger.error("Failed to create comment", {
      requestId,
      userId: currentUser.user.id,
      error: String(err),
    });
    return actionError("Failed to add comment. Please try again.");
  }

  await logActivity({
    requestId,
    actorId: currentUser.user.id,
    action: "commented",
  });

  revalidatePath(`/requests/${requestId}`);
  return actionSuccess();
}

/** Soft-deletes a comment when the current user has admin rights. */
export async function deleteComment(commentId: number): Promise<ActionResult> {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) return actionError(getAuthFailureMessage(currentUser.reason));

  const [comment] = await db
    .select({ requestId: requestComments.requestId })
    .from(requestComments)
    .where(and(eq(requestComments.id, commentId), isNull(requestComments.deletedAt)))
    .limit(1);

  if (!comment) return actionError("Comment not found");
  if (!isAdminRole(currentUser.user.role)) return actionError("Forbidden");

  try {
    await db
      .update(requestComments)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(requestComments.id, commentId));
  } catch (err) {
    logger.error("Failed to delete comment", {
      commentId,
      userId: currentUser.user.id,
      error: String(err),
    });
    return actionError("Failed to delete comment. Please try again.");
  }

  revalidatePath(`/requests/${comment.requestId}`);
  return actionSuccess();
}

/** Updates a comment when the current user is the original author. */
export async function updateComment(commentId: number, content: string): Promise<ActionResult> {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) return actionError(getAuthFailureMessage(currentUser.reason));

  const parsed = commentSchema.safeParse({ content });
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const [comment] = await db
    .select({ authorId: requestComments.authorId, requestId: requestComments.requestId })
    .from(requestComments)
    .where(and(eq(requestComments.id, commentId), isNull(requestComments.deletedAt)))
    .limit(1);

  if (!comment) return actionError("Comment not found");
  if (String(comment.authorId) !== currentUser.user.sessionUserId) return actionError("Forbidden");

  try {
    await db
      .update(requestComments)
      .set({ content: parsed.data.content, updatedAt: new Date() })
      .where(eq(requestComments.id, commentId));
  } catch (err) {
    logger.error("Failed to update comment", {
      commentId,
      userId: currentUser.user.id,
      error: String(err),
    });
    return actionError("Failed to update comment. Please try again.");
  }

  revalidatePath(`/requests/${comment.requestId}`);
  return actionSuccess();
}
