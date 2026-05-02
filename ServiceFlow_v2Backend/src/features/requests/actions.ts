"use server";

import { revalidatePath } from "next/cache";
import { db } from "@database/client";
import { serviceRequests, users } from "@database/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@backend/auth/config";
import { createRequestSchema, updateRequestSchema } from "@shared/validation/request";
import { getRequestCountForYear } from "@backend/features/requests/queries";
import { canManageRequest } from "@backend/features/requests/permissions";
import { generateRequestCode } from "@shared/utils";
import { logActivity } from "@backend/features/activities/actions";
import { sendEmail } from "@backend/email";
import { requestCreatedTemplate } from "@backend/email/templates/request-created";
import { statusChangedTemplate } from "@backend/email/templates/status-changed";
import { requestAssignedTemplate } from "@backend/email/templates/request-assigned";
import { logger } from "@backend/utils/logger";
import { actionError, actionSuccess, type ActionResult } from "@shared/action-result";
import type { CreateRequestInput, UpdateRequestInput } from "@shared/validation/request";

/** Creates a request for the authenticated user and triggers audit/email side effects. */
export async function createRequest(data: CreateRequestInput): Promise<ActionResult<{ requestCode: string }>> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");

  const parsed = createRequestSchema.safeParse(data);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const year = new Date().getFullYear();
  const count = await getRequestCountForYear(year);
  const requestCode = generateRequestCode(year, count + 1);
  const actorId = parseInt(session.user.id);

  let newRequestId: number;

  try {
    const [inserted] = await db
      .insert(serviceRequests)
      .values({
        ...parsed.data,
        requestCode,
        requestedById: actorId,
      })
      .returning({ id: serviceRequests.id });

    newRequestId = inserted.id;
  } catch (err) {
    logger.error("Failed to create service request", {
      userId: session.user.id,
      error: String(err),
    });
    return actionError("Failed to create request. Please try again.");
  }

  // Fire-and-forget: activity log + email notification
  await logActivity({ requestId: newRequestId, actorId, action: "created" });

  const { subject, html } = requestCreatedTemplate({
    requesterName: session.user.name ?? "User",
    requestCode,
    requestTitle: parsed.data.title,
    requestId: newRequestId,
  });
  sendEmail({ to: session.user.email ?? "", subject, html });

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  return actionSuccess({ requestCode });
}

/** Updates an existing request when the current user owns it or has admin rights. */
export async function updateRequest(id: number, data: UpdateRequestInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");

  const parsed = updateRequestSchema.safeParse(data);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const [existing] = await db
    .select({
      requestedById: serviceRequests.requestedById,
      status: serviceRequests.status,
      requestCode: serviceRequests.requestCode,
      title: serviceRequests.title,
      requestedByEmail: users.email,
      requestedByName: users.name,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(serviceRequests.requestedById, users.id))
    .where(and(eq(serviceRequests.id, id), isNull(serviceRequests.deletedAt)))
    .limit(1);

  if (!existing) return actionError("Request not found");

  if (
    !canManageRequest({
      role: session.user.role === "admin" ? "admin" : "user",
      requestOwnerId: existing.requestedById,
      currentUserId: session.user.id,
    })
  ) {
    return actionError("Forbidden");
  }

  const actorId = parseInt(session.user.id);
  const statusChanged = parsed.data.status !== existing.status;
  const resolvedAt =
    parsed.data.status === "resolved" && existing.status !== "resolved"
      ? new Date()
      : undefined;

  try {
    await db
      .update(serviceRequests)
      .set({
        ...parsed.data,
        ...(resolvedAt ? { resolvedAt } : {}),
        updatedAt: new Date(),
      })
      .where(eq(serviceRequests.id, id));
  } catch (err) {
    logger.error("Failed to update service request", {
      requestId: id,
      userId: session.user.id,
      error: String(err),
    });
    return actionError("Failed to update request. Please try again.");
  }

  // Activity log + email on status change
  if (statusChanged) {
    await logActivity({
      requestId: id,
      actorId,
      action: "status_changed",
      fieldChanged: "status",
      oldValue: existing.status,
      newValue: parsed.data.status,
    });

    const { subject, html } = statusChangedTemplate({
      requesterName: existing.requestedByName,
      requestCode: existing.requestCode,
      requestTitle: existing.title,
      requestId: id,
      oldStatus: existing.status,
      newStatus: parsed.data.status,
    });
    sendEmail({ to: existing.requestedByEmail, subject, html });
  } else {
    await logActivity({ requestId: id, actorId, action: "updated" });
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  revalidatePath("/dashboard");
  return actionSuccess();
}

/** Assigns or unassigns a request to a user; admin-only. */
export async function assignRequest(id: number, assigneeId: number | null): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");
  if (session.user.role !== "admin") return actionError("Forbidden");

  const [existing] = await db
    .select({
      requestCode: serviceRequests.requestCode,
      title: serviceRequests.title,
      requestedByName: users.name,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(serviceRequests.requestedById, users.id))
    .where(and(eq(serviceRequests.id, id), isNull(serviceRequests.deletedAt)))
    .limit(1);

  if (!existing) return actionError("Request not found");

  try {
    await db
      .update(serviceRequests)
      .set({ assigneeId: assigneeId ?? null, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id));
  } catch (err) {
    logger.error("Failed to assign request", {
      requestId: id,
      assigneeId,
      error: String(err),
    });
    return actionError("Failed to assign request. Please try again.");
  }

  const actorId = parseInt(session.user.id);

  if (assigneeId !== null) {
    await logActivity({
      requestId: id,
      actorId,
      action: "assigned",
      newValue: String(assigneeId),
    });

    // Email the new assignee
    const [assignee] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, assigneeId))
      .limit(1);

    if (assignee) {
      const { subject, html } = requestAssignedTemplate({
        assigneeName: assignee.name,
        requestCode: existing.requestCode,
        requestTitle: existing.title,
        requestId: id,
        requesterName: existing.requestedByName,
      });
      sendEmail({ to: assignee.email, subject, html });
    }
  } else {
    await logActivity({ requestId: id, actorId, action: "unassigned" });
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return actionSuccess();
}

/** Soft-deletes a request when the current user owns it or has admin rights. */
export async function softDeleteRequest(id: number): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return actionError("Unauthorized");

  const [existing] = await db
    .select({ requestedById: serviceRequests.requestedById })
    .from(serviceRequests)
    .where(and(eq(serviceRequests.id, id), isNull(serviceRequests.deletedAt)))
    .limit(1);

  if (!existing) return actionError("Request not found");

  if (
    !canManageRequest({
      role: session.user.role === "admin" ? "admin" : "user",
      requestOwnerId: existing.requestedById,
      currentUserId: session.user.id,
    })
  ) {
    return actionError("Forbidden");
  }

  try {
    await db
      .update(serviceRequests)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(serviceRequests.id, id));
  } catch (err) {
    logger.error("Failed to delete service request", {
      requestId: id,
      userId: session.user.id,
      error: String(err),
    });
    return actionError("Failed to delete request. Please try again.");
  }

  await logActivity({
    requestId: id,
    actorId: parseInt(session.user.id),
    action: "deleted",
  });

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  return actionSuccess();
}
