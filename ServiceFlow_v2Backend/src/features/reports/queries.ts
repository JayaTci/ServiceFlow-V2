import { db } from "@database/client";
import { serviceRequests } from "@database/schema";
import { and, count, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { PRIORITY_LABELS, REQUEST_TYPE_LABELS, STATUS_LABELS } from "@shared/constants/requests";
import type { CountByField, DashboardStats } from "@shared/types";

// Builds the shared report date/deleted filters for aggregate queries.
function buildDateConditions(
  dateFrom?: string,
  dateTo?: string,
  userId?: string,
  isAdmin?: boolean
) {
  const conditions = [isNull(serviceRequests.deletedAt)];
  if (!isAdmin) {
    const parsedUserId = userId ? Number.parseInt(userId, 10) : NaN;
    conditions.push(eq(serviceRequests.requestedById, Number.isNaN(parsedUserId) ? -1 : parsedUserId));
  }
  if (dateFrom) conditions.push(gte(serviceRequests.dateRequested, dateFrom));
  if (dateTo) conditions.push(lte(serviceRequests.dateRequested, dateTo));
  return conditions;
}

export async function getDashboardStats(
  dateFrom?: string,
  dateTo?: string,
  userId?: string,
  isAdmin?: boolean
): Promise<DashboardStats> {
  const conditions = buildDateConditions(dateFrom, dateTo, userId, isAdmin);

  const results = await db
    .select({
      status: serviceRequests.status,
      count: count(),
    })
    .from(serviceRequests)
    .where(and(...conditions))
    .groupBy(serviceRequests.status);

  const stats = { total: 0, pending: 0, inProgress: 0, resolved: 0 };
  for (const row of results) {
    stats.total += row.count;
    if (row.status === "pending") stats.pending = row.count;
    if (row.status === "in_progress") stats.inProgress = row.count;
    if (row.status === "resolved") stats.resolved = row.count;
  }
  return stats;
}

export async function getCountByStatus(
  dateFrom?: string,
  dateTo?: string,
  userId?: string,
  isAdmin?: boolean
): Promise<CountByField[]> {
  const conditions = buildDateConditions(dateFrom, dateTo, userId, isAdmin);
  const results = await db
    .select({ value: serviceRequests.status, count: count() })
    .from(serviceRequests)
    .where(and(...conditions))
    .groupBy(serviceRequests.status)
    .orderBy(serviceRequests.status);

  return results.map((r) => ({
    label: STATUS_LABELS[r.value] ?? r.value,
    value: r.value,
    count: r.count,
  }));
}

export async function getCountByType(
  dateFrom?: string,
  dateTo?: string,
  userId?: string,
  isAdmin?: boolean
): Promise<CountByField[]> {
  const conditions = buildDateConditions(dateFrom, dateTo, userId, isAdmin);
  const results = await db
    .select({ value: serviceRequests.requestType, count: count() })
    .from(serviceRequests)
    .where(and(...conditions))
    .groupBy(serviceRequests.requestType)
    .orderBy(serviceRequests.requestType);

  return results.map((r) => ({
    label: REQUEST_TYPE_LABELS[r.value] ?? r.value,
    value: r.value,
    count: r.count,
  }));
}

export async function getCountByDepartment(
  dateFrom?: string,
  dateTo?: string,
  userId?: string,
  isAdmin?: boolean
): Promise<CountByField[]> {
  const conditions = buildDateConditions(dateFrom, dateTo, userId, isAdmin);
  const results = await db
    .select({ value: serviceRequests.department, count: count() })
    .from(serviceRequests)
    .where(and(...conditions))
    .groupBy(serviceRequests.department)
    .orderBy(serviceRequests.department);

  return results.map((r) => ({
    label: r.value,
    value: r.value,
    count: r.count,
  }));
}

export async function getCountByPriority(
  dateFrom?: string,
  dateTo?: string,
  userId?: string,
  isAdmin?: boolean
): Promise<CountByField[]> {
  const conditions = buildDateConditions(dateFrom, dateTo, userId, isAdmin);
  const results = await db
    .select({ value: serviceRequests.priority, count: count() })
    .from(serviceRequests)
    .where(and(...conditions))
    .groupBy(serviceRequests.priority)
    .orderBy(serviceRequests.priority);

  return results.map((r) => ({
    label: PRIORITY_LABELS[r.value] ?? r.value,
    value: r.value,
    count: r.count,
  }));
}

export async function getMonthlyTrend(
  userId?: string,
  isAdmin?: boolean
): Promise<{ month: string; count: number }[]> {
  const conditions = buildDateConditions(undefined, undefined, userId, isAdmin);
  conditions.push(sql`${serviceRequests.createdAt} >= NOW() - INTERVAL '6 months'`);

  const results = await db
    .select({
      month: sql<string>`TO_CHAR(${serviceRequests.createdAt}, 'Mon YYYY')`,
      monthSort: sql<string>`TO_CHAR(${serviceRequests.createdAt}, 'YYYY-MM')`,
      count: count(),
    })
    .from(serviceRequests)
    .where(and(...conditions))
    .groupBy(
      sql`TO_CHAR(${serviceRequests.createdAt}, 'Mon YYYY')`,
      sql`TO_CHAR(${serviceRequests.createdAt}, 'YYYY-MM')`
    )
    .orderBy(sql`TO_CHAR(${serviceRequests.createdAt}, 'YYYY-MM')`);

  return results.map((r) => ({ month: r.month, count: r.count }));
}
