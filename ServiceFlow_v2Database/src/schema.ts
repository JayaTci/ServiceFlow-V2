import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ─────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["superadmin", "admin", "user"]);

export const requestTypeEnum = pgEnum("request_type", [
  "it_support",
  "maintenance",
  "office",
  "document_processing",
  "general",
]);

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const statusEnum = pgEnum("status", [
  "pending",
  "in_progress",
  "resolved",
  "closed",
  "cancelled",
]);

// Activity action types for the audit log
export const activityActionEnum = pgEnum("activity_action", [
  "created",
  "status_changed",
  "priority_changed",
  "assigned",
  "unassigned",
  "updated",
  "commented",
  "deleted",
]);

export const accountAuditActionEnum = pgEnum("account_audit_action", [
  "user_created",
  "role_changed",
  "deactivated",
  "reactivated",
  "temporary_password_set",
]);

// ─── Users ─────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: roleEnum("role").notNull().default("user"),
    isActive: boolean("is_active").notNull().default(true),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    sessionVersion: integer("session_version").notNull().default(0),
    department: varchar("department", { length: 100 }),
    emailVerified: timestamp("email_verified"),
    // Password reset — token is stored hashed; cleared after use
    passwordResetToken: varchar("password_reset_token", { length: 255 }),
    passwordResetExpiresAt: timestamp("password_reset_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_password_reset_token_idx").on(table.passwordResetToken),
  ]
);

// ─── Service Requests ──────────────────────────────────────────────────────

export const serviceRequests = pgTable(
  "service_requests",
  {
    id: serial("id").primaryKey(),
    requestCode: varchar("request_code", { length: 20 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    requestType: requestTypeEnum("request_type").notNull(),
    department: varchar("department", { length: 100 }).notNull(),
    requestedById: integer("requested_by_id")
      .references(() => users.id)
      .notNull(),
    // V2: optional assignee (typically an admin user)
    assigneeId: integer("assignee_id").references(() => users.id),
    dateRequested: date("date_requested").notNull(),
    priority: priorityEnum("priority").notNull().default("medium"),
    status: statusEnum("status").notNull().default("pending"),
    // Populated when status transitions to "resolved"
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("service_requests_requested_by_idx").on(table.requestedById),
    index("service_requests_assignee_idx").on(table.assigneeId),
    index("service_requests_deleted_at_idx").on(table.deletedAt),
    index("service_requests_created_at_idx").on(table.createdAt),
  ]
);

// ─── Request Comments ──────────────────────────────────────────────────────

export const requestComments = pgTable("request_comments", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id")
    .references(() => serviceRequests.id)
    .notNull(),
  authorId: integer("author_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Soft-delete so activity log references remain intact
  deletedAt: timestamp("deleted_at"),
});

// ─── Request Activities (Audit Log) ───────────────────────────────────────

export const requestActivities = pgTable("request_activities", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id")
    .references(() => serviceRequests.id)
    .notNull(),
  actorId: integer("actor_id")
    .references(() => users.id)
    .notNull(),
  action: activityActionEnum("action").notNull(),
  // Which field changed (e.g. "status", "priority", "assigneeId")
  fieldChanged: varchar("field_changed", { length: 100 }),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accountAuditEvents = pgTable("account_audit_events", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id")
    .references(() => users.id)
    .notNull(),
  targetUserId: integer("target_user_id")
    .references(() => users.id)
    .notNull(),
  action: accountAuditActionEnum("action").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const securityRateLimits = pgTable("security_rate_limits", {
  key: varchar("key", { length: 128 }).primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStart: timestamp("window_start").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  serviceRequests: many(serviceRequests, { relationName: "requester" }),
  assignedRequests: many(serviceRequests, { relationName: "assignee" }),
  comments: many(requestComments),
  activities: many(requestActivities),
  accountAuditEventsActed: many(accountAuditEvents, { relationName: "accountAuditActor" }),
  accountAuditEventsTargeted: many(accountAuditEvents, { relationName: "accountAuditTarget" }),
}));

export const serviceRequestsRelations = relations(
  serviceRequests,
  ({ one, many }) => ({
    requestedBy: one(users, {
      fields: [serviceRequests.requestedById],
      references: [users.id],
      relationName: "requester",
    }),
    assignee: one(users, {
      fields: [serviceRequests.assigneeId],
      references: [users.id],
      relationName: "assignee",
    }),
    comments: many(requestComments),
    activities: many(requestActivities),
  })
);

export const requestCommentsRelations = relations(requestComments, ({ one }) => ({
  request: one(serviceRequests, {
    fields: [requestComments.requestId],
    references: [serviceRequests.id],
  }),
  author: one(users, {
    fields: [requestComments.authorId],
    references: [users.id],
  }),
}));

export const requestActivitiesRelations = relations(requestActivities, ({ one }) => ({
  request: one(serviceRequests, {
    fields: [requestActivities.requestId],
    references: [serviceRequests.id],
  }),
  actor: one(users, {
    fields: [requestActivities.actorId],
    references: [users.id],
  }),
}));

export const accountAuditEventsRelations = relations(accountAuditEvents, ({ one }) => ({
  actor: one(users, {
    fields: [accountAuditEvents.actorId],
    references: [users.id],
    relationName: "accountAuditActor",
  }),
  targetUser: one(users, {
    fields: [accountAuditEvents.targetUserId],
    references: [users.id],
    relationName: "accountAuditTarget",
  }),
}));

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type NewServiceRequest = typeof serviceRequests.$inferInsert;
export type RequestComment = typeof requestComments.$inferSelect;
export type NewRequestComment = typeof requestComments.$inferInsert;
export type RequestActivity = typeof requestActivities.$inferSelect;
export type NewRequestActivity = typeof requestActivities.$inferInsert;
export type AccountAuditEvent = typeof accountAuditEvents.$inferSelect;
export type NewAccountAuditEvent = typeof accountAuditEvents.$inferInsert;
export type SecurityRateLimit = typeof securityRateLimits.$inferSelect;
export type NewSecurityRateLimit = typeof securityRateLimits.$inferInsert;
export type Role = (typeof roleEnum.enumValues)[number];
export type RequestType = (typeof requestTypeEnum.enumValues)[number];
export type Priority = (typeof priorityEnum.enumValues)[number];
export type Status = (typeof statusEnum.enumValues)[number];
export type ActivityAction = (typeof activityActionEnum.enumValues)[number];
export type AccountAuditAction = (typeof accountAuditActionEnum.enumValues)[number];
