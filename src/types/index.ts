import type { ServiceRequest, User, RequestComment, RequestActivity } from "@/lib/db/schema";

// ─── Request Types ───────────────────────────────────────────────────────────

/** Service request with the user who submitted it and optional assignee. */
export type ServiceRequestWithUser = ServiceRequest & {
  requestedBy: Pick<User, "id" | "name" | "email" | "department">;
  assignee?: Pick<User, "id" | "name" | "email"> | null;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ─── Dashboard Types ─────────────────────────────────────────────────────────

export type DashboardStats = {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
};

export type CountByField = {
  label: string;
  value: string;
  count: number;
};

// ─── Activity / Comment Types ────────────────────────────────────────────────

/** Activity log entry with the actor's name. */
export type ActivityWithActor = RequestActivity & {
  actor: Pick<User, "id" | "name" | "email">;
};

/** Comment with the author's details. */
export type CommentWithAuthor = RequestComment & {
  author: Pick<User, "id" | "name" | "email" | "role">;
};
