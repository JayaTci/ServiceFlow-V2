import { db } from "@database/client";
import { serviceRequests, users } from "@database/schema";
import { and, eq, isNull, ilike, or, gte, lte, desc, count, sql } from "drizzle-orm";
import type { RequestFilters } from "@shared/validation/request";
import type { PaginatedResult, ServiceRequestWithUser } from "@shared/types";

// Builds request list filters while enforcing non-admin ownership visibility.
function buildWhereConditions(filters: Partial<RequestFilters>, userId?: string, isAdmin?: boolean) {
  const conditions = [isNull(serviceRequests.deletedAt)];

  if (!isAdmin && userId) {
    conditions.push(eq(serviceRequests.requestedById, parseInt(userId)));
  }

  if (filters.search) {
    conditions.push(
      or(
        ilike(serviceRequests.title, `%${filters.search}%`),
        ilike(serviceRequests.requestCode, `%${filters.search}%`),
        ilike(serviceRequests.department, `%${filters.search}%`)
      )!
    );
  }

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(serviceRequests.status, filters.status as "pending" | "in_progress" | "resolved" | "closed" | "cancelled"));
  }

  if (filters.requestType && filters.requestType !== "all") {
    conditions.push(eq(serviceRequests.requestType, filters.requestType as "it_support" | "maintenance" | "office" | "document_processing" | "general"));
  }

  if (filters.department && filters.department !== "all") {
    conditions.push(eq(serviceRequests.department, filters.department));
  }

  if (filters.priority && filters.priority !== "all") {
    conditions.push(eq(serviceRequests.priority, filters.priority as "low" | "medium" | "high" | "urgent"));
  }

  if (filters.dateFrom) {
    conditions.push(gte(serviceRequests.dateRequested, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(serviceRequests.dateRequested, filters.dateTo));
  }

  return conditions;
}

export async function getRequests(
  filters: Partial<RequestFilters> = {},
  userId?: string,
  isAdmin?: boolean
): Promise<PaginatedResult<ServiceRequestWithUser>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  const conditions = buildWhereConditions(filters, userId, isAdmin);
  const whereClause = and(...conditions);

  const [totalResult, data] = await Promise.all([
    db
      .select({ count: count() })
      .from(serviceRequests)
      .where(whereClause),
    db
      .select({
        id: serviceRequests.id,
        requestCode: serviceRequests.requestCode,
        title: serviceRequests.title,
        description: serviceRequests.description,
        requestType: serviceRequests.requestType,
        department: serviceRequests.department,
        requestedById: serviceRequests.requestedById,
        dateRequested: serviceRequests.dateRequested,
        priority: serviceRequests.priority,
        status: serviceRequests.status,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt,
        deletedAt: serviceRequests.deletedAt,
        requestedBy: {
          id: users.id,
          name: users.name,
          email: users.email,
          department: users.department,
        },
      })
      .from(serviceRequests)
      .innerJoin(users, eq(serviceRequests.requestedById, users.id))
      .where(whereClause)
      .orderBy(desc(serviceRequests.createdAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data: data as ServiceRequestWithUser[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getRequestById(id: number): Promise<ServiceRequestWithUser | null> {
  const [result] = await db
    .select({
      id: serviceRequests.id,
      requestCode: serviceRequests.requestCode,
      title: serviceRequests.title,
      description: serviceRequests.description,
      requestType: serviceRequests.requestType,
      department: serviceRequests.department,
      requestedById: serviceRequests.requestedById,
      dateRequested: serviceRequests.dateRequested,
      priority: serviceRequests.priority,
      status: serviceRequests.status,
      createdAt: serviceRequests.createdAt,
      updatedAt: serviceRequests.updatedAt,
      deletedAt: serviceRequests.deletedAt,
      requestedBy: {
        id: users.id,
        name: users.name,
        email: users.email,
        department: users.department,
      },
    })
    .from(serviceRequests)
    .innerJoin(users, eq(serviceRequests.requestedById, users.id))
    .where(and(eq(serviceRequests.id, id), isNull(serviceRequests.deletedAt)))
    .limit(1);

  return (result as ServiceRequestWithUser) ?? null;
}

export async function getRequestCountForYear(year: number): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(serviceRequests)
    .where(
      sql`EXTRACT(YEAR FROM ${serviceRequests.createdAt}) = ${year}`
    );
  return result?.count ?? 0;
}
