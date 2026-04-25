"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requestComments, serviceRequests } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { logActivity } from "@/lib/actions/activities";
import { logger } from "@/lib/logger";
import { z } from "zod";

const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment is too long"),
});

export async function createComment(requestId: number, content: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const parsed = commentSchema.safeParse({ content });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Confirm the request exists and is not deleted
  const [request] = await db
    .select({ id: serviceRequests.id })
    .from(serviceRequests)
    .where(and(eq(serviceRequests.id, requestId), isNull(serviceRequests.deletedAt)))
    .limit(1);

  if (!request) return { error: "Request not found" };

  try {
    await db.insert(requestComments).values({
      requestId,
      authorId: parseInt(session.user.id),
      content: parsed.data.content,
    });
  } catch (err) {
    logger.error("Failed to create comment", {
      requestId,
      userId: session.user.id,
      error: String(err),
    });
    return { error: "Failed to add comment. Please try again." };
  }

  // Log activity — non-fatal if it fails
  await logActivity({
    requestId,
    actorId: parseInt(session.user.id),
    action: "commented",
  });

  revalidatePath(`/requests/${requestId}`);
  return { success: true };
}

export async function deleteComment(commentId: number) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const [comment] = await db
    .select({ authorId: requestComments.authorId, requestId: requestComments.requestId })
    .from(requestComments)
    .where(and(eq(requestComments.id, commentId), isNull(requestComments.deletedAt)))
    .limit(1);

  if (!comment) return { error: "Comment not found" };

  const isAdmin = session.user.role === "admin";
  const isAuthor = String(comment.authorId) === session.user.id;
  if (!isAdmin && !isAuthor) return { error: "Forbidden" };

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
    return { error: "Failed to delete comment. Please try again." };
  }

  revalidatePath(`/requests/${comment.requestId}`);
  return { success: true };
}

export async function updateComment(commentId: number, content: string) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const parsed = commentSchema.safeParse({ content });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [comment] = await db
    .select({ authorId: requestComments.authorId, requestId: requestComments.requestId })
    .from(requestComments)
    .where(and(eq(requestComments.id, commentId), isNull(requestComments.deletedAt)))
    .limit(1);

  if (!comment) return { error: "Comment not found" };

  // Only the original author can edit their comment
  if (String(comment.authorId) !== session.user.id) return { error: "Forbidden" };

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
    return { error: "Failed to update comment. Please try again." };
  }

  revalidatePath(`/requests/${comment.requestId}`);
  return { success: true };
}
