import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  date,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ─────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["admin", "user"]);

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

// ─── Users ─────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: roleEnum("role").notNull().default("user"),
    department: varchar("department", { length: 100 }),
    emailVerified: timestamp("email_verified"),
    // Password reset — token is stored hashed; cleared after use
    passwordResetToken: varchar("password_reset_token", { length: 255 }),
    passwordResetExpiresAt: timestamp("password_reset_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

// ─── Service Requests ──────────────────────────────────────────────────────

export const serviceRequests = pgTable("service_requests", {
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
});

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

// ─── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  serviceRequests: many(serviceRequests, { relationName: "requester" }),
  assignedRequests: many(serviceRequests, { relationName: "assignee" }),
  comments: many(requestComments),
  activities: many(requestActivities),
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

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type NewServiceRequest = typeof serviceRequests.$inferInsert;
export type RequestComment = typeof requestComments.$inferSelect;
export type NewRequestComment = typeof requestComments.$inferInsert;
export type RequestActivity = typeof requestActivities.$inferSelect;
export type NewRequestActivity = typeof requestActivities.$inferInsert;
export type Role = (typeof roleEnum.enumValues)[number];
export type RequestType = (typeof requestTypeEnum.enumValues)[number];
export type Priority = (typeof priorityEnum.enumValues)[number];
export type Status = (typeof statusEnum.enumValues)[number];
export type ActivityAction = (typeof activityActionEnum.enumValues)[number];
