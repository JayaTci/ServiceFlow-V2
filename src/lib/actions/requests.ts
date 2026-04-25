"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { serviceRequests, users } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { createRequestSchema, updateRequestSchema } from "@/lib/validations/request";
import { getRequestCountForYear } from "@/lib/queries/requests";
import { generateRequestCode } from "@/lib/utils";
import { logActivity } from "@/lib/actions/activities";
import { sendEmail } from "@/lib/email";
import { requestCreatedTemplate } from "@/lib/email/templates/request-created";
import { statusChangedTemplate } from "@/lib/email/templates/status-changed";
import { requestAssignedTemplate } from "@/lib/email/templates/request-assigned";
import { logger } from "@/lib/logger";
import type { CreateRequestInput, UpdateRequestInput } from "@/lib/validations/request";

export async function createRequest(data: CreateRequestInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const parsed = createRequestSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

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
    return { error: "Failed to create request. Please try again." };
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
  return { success: true, requestCode };
}

export async function updateRequest(id: number, data: UpdateRequestInput) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const parsed = updateRequestSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

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

  if (!existing) return { error: "Request not found" };

  const isAdmin = session.user.role === "admin";
  const isOwner = String(existing.requestedById) === session.user.id;
  if (!isAdmin && !isOwner) return { error: "Forbidden" };

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
    return { error: "Failed to update request. Please try again." };
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
  return { success: true };
}

export async function assignRequest(id: number, assigneeId: number | null) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (session.user.role !== "admin") return { error: "Forbidden" };

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

  if (!existing) return { error: "Request not found" };

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
    return { error: "Failed to assign request. Please try again." };
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
  return { success: true };
}

export async function softDeleteRequest(id: number) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const [existing] = await db
    .select({ requestedById: serviceRequests.requestedById })
    .from(serviceRequests)
    .where(and(eq(serviceRequests.id, id), isNull(serviceRequests.deletedAt)))
    .limit(1);

  if (!existing) return { error: "Request not found" };

  const isAdmin = session.user.role === "admin";
  const isOwner = String(existing.requestedById) === session.user.id;
  if (!isAdmin && !isOwner) return { error: "Forbidden" };

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
    return { error: "Failed to delete request. Please try again." };
  }

  await logActivity({
    requestId: id,
    actorId: parseInt(session.user.id),
    action: "deleted",
  });

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  return { success: true };
}
