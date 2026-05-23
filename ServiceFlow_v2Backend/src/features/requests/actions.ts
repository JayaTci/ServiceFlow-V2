"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import { getAuthFailureMessage, getCurrentUserContext } from "@backend/auth/current-user";
import { isAdminRole } from "@backend/auth/rbac";
import { logActivity } from "@backend/features/activities/actions";
import { canDeleteRequest, canEditRequest } from "@backend/features/requests/permissions";
import { sendEmail } from "@backend/email";
import { requestAssignedTemplate } from "@backend/email/templates/request-assigned";
import { requestCreatedTemplate } from "@backend/email/templates/request-created";
import { statusChangedTemplate } from "@backend/email/templates/status-changed";
import { logger } from "@backend/utils/logger";
import { db } from "@database/client";
import { serviceRequests, users } from "@database/schema";
import { actionError, actionSuccess, type ActionResult } from "@shared/action-result";
import { generateRequestCode } from "@shared/utils";
import {
  createRequestSchema,
  updateRequestSchema,
  type CreateRequestInput,
  type UpdateRequestInput,
} from "@shared/validation/request";

/** Creates a request for the authenticated user and triggers audit/email side effects. */
export async function createRequest(
  data: CreateRequestInput
): Promise<ActionResult<{ requestCode: string }>> {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) return actionError(getAuthFailureMessage(currentUser.reason));

  const parsed = createRequestSchema.safeParse(data);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const year = new Date().getFullYear();
  let requestCode = "";

  let newRequestId: number;

  try {
    const inserted = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${year})`);

      const [countResult] = await tx
        .select({ count: count() })
        .from(serviceRequests)
        .where(sql`EXTRACT(YEAR FROM ${serviceRequests.createdAt}) = ${year}`);

      requestCode = generateRequestCode(year, (countResult?.count ?? 0) + 1);

      const [row] = await tx
        .insert(serviceRequests)
        .values({
          ...parsed.data,
          requestCode,
          requestedById: currentUser.user.id,
        })
        .returning({ id: serviceRequests.id });

      return row;
    });

    newRequestId = inserted.id;
  } catch (err) {
    logger.error("Failed to create service request", {
      userId: currentUser.user.id,
      error: String(err),
    });
    return actionError("Failed to create request. Please try again.");
  }

  await logActivity({
    requestId: newRequestId,
    actorId: currentUser.user.id,
    action: "created",
  });

  const { subject, html } = requestCreatedTemplate({
    requesterName: currentUser.user.name,
    requestCode,
    requestTitle: parsed.data.title,
    requestId: newRequestId,
  });
  await sendEmail({ to: currentUser.user.email, subject, html });

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  return actionSuccess({ requestCode });
}

/** Updates an existing request when the current user owns it or has admin rights. */
export async function updateRequest(id: number, data: UpdateRequestInput): Promise<ActionResult> {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) return actionError(getAuthFailureMessage(currentUser.reason));

  const parsed = updateRequestSchema.safeParse(data);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const [existing] = await db
    .select({
      requestedById: serviceRequests.requestedById,
      status: serviceRequests.status,
      priority: serviceRequests.priority,
      resolvedAt: serviceRequests.resolvedAt,
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
    !canEditRequest({
      role: currentUser.user.role,
      requestOwnerId: existing.requestedById,
      currentUserId: currentUser.user.sessionUserId,
    })
  ) {
    return actionError("Forbidden");
  }

  const statusChanged = parsed.data.status !== existing.status;
  const priorityChanged = parsed.data.priority !== existing.priority;
  const resolvedAt =
    parsed.data.status === "resolved" && existing.status !== "resolved"
      ? new Date()
      : undefined;
  const nextResolvedAt =
    parsed.data.status === "resolved" ? resolvedAt ?? existing.resolvedAt : null;

  try {
    await db
      .update(serviceRequests)
      .set({
        ...parsed.data,
        resolvedAt: nextResolvedAt,
        updatedAt: new Date(),
      })
      .where(eq(serviceRequests.id, id));
  } catch (err) {
    logger.error("Failed to update service request", {
      requestId: id,
      userId: currentUser.user.id,
      error: String(err),
    });
    return actionError("Failed to update request. Please try again.");
  }

  if (statusChanged) {
    await logActivity({
      requestId: id,
      actorId: currentUser.user.id,
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
    await sendEmail({ to: existing.requestedByEmail, subject, html });
  }

  if (priorityChanged) {
    await logActivity({
      requestId: id,
      actorId: currentUser.user.id,
      action: "priority_changed",
      fieldChanged: "priority",
      oldValue: existing.priority,
      newValue: parsed.data.priority,
    });
  }

  if (!statusChanged && !priorityChanged) {
    await logActivity({ requestId: id, actorId: currentUser.user.id, action: "updated" });
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  revalidatePath("/dashboard");
  return actionSuccess();
}

/** Assigns or unassigns a request to a user; admin-only. */
export async function assignRequest(id: number, assigneeId: number | null): Promise<ActionResult> {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) return actionError(getAuthFailureMessage(currentUser.reason));
  if (!currentUser.user.isAdmin) return actionError("Forbidden");

  const [existing] = await db
    .select({
      requestCode: serviceRequests.requestCode,
      title: serviceRequests.title,
      requestedByName: users.name,
      assigneeId: serviceRequests.assigneeId,
    })
    .from(serviceRequests)
    .innerJoin(users, eq(serviceRequests.requestedById, users.id))
    .where(and(eq(serviceRequests.id, id), isNull(serviceRequests.deletedAt)))
    .limit(1);

  if (!existing) return actionError("Request not found");

  let assignee: { name: string; email: string; role: string; isActive: boolean } | undefined;
  if (assigneeId !== null) {
    [assignee] = await db
      .select({ name: users.name, email: users.email, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, assigneeId))
      .limit(1);

    if (!assignee || !assignee.isActive || !isAdminRole(assignee.role)) {
      return actionError("Assignee must be an active admin user.");
    }
  }

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

  if (assigneeId !== null) {
    await logActivity({
      requestId: id,
      actorId: currentUser.user.id,
      action: "assigned",
      fieldChanged: "assigneeId",
      oldValue: existing.assigneeId === null ? undefined : String(existing.assigneeId),
      newValue: String(assigneeId),
    });

    if (assignee) {
      const { subject, html } = requestAssignedTemplate({
        assigneeName: assignee.name,
        requestCode: existing.requestCode,
        requestTitle: existing.title,
        requestId: id,
        requesterName: existing.requestedByName,
      });
      await sendEmail({ to: assignee.email, subject, html });
    }
  } else {
    await logActivity({
      requestId: id,
      actorId: currentUser.user.id,
      action: "unassigned",
      fieldChanged: "assigneeId",
      oldValue: existing.assigneeId === null ? undefined : String(existing.assigneeId),
    });
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);
  return actionSuccess();
}

/** Soft-deletes a request when the current user has admin rights. */
export async function softDeleteRequest(id: number): Promise<ActionResult> {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) return actionError(getAuthFailureMessage(currentUser.reason));

  const [existing] = await db
    .select({ requestedById: serviceRequests.requestedById })
    .from(serviceRequests)
    .where(and(eq(serviceRequests.id, id), isNull(serviceRequests.deletedAt)))
    .limit(1);

  if (!existing) return actionError("Request not found");
  if (!canDeleteRequest(currentUser.user.role)) return actionError("Forbidden");

  try {
    await db
      .update(serviceRequests)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(serviceRequests.id, id));
  } catch (err) {
    logger.error("Failed to delete service request", {
      requestId: id,
      userId: currentUser.user.id,
      error: String(err),
    });
    return actionError("Failed to delete request. Please try again.");
  }

  await logActivity({
    requestId: id,
    actorId: currentUser.user.id,
    action: "deleted",
  });

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  return actionSuccess();
}
