import { z } from "zod";
import { DEPARTMENTS } from "@shared/constants/departments";

const departmentSchema = z
  .string()
  .min(1, "Department is required")
  .refine((value) => DEPARTMENTS.includes(value as (typeof DEPARTMENTS)[number]), {
    message: "Invalid department",
  });

const optionalDateSchema = z
  .string()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: "Invalid date format",
  });

export const createRequestSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be 2000 characters or fewer"),
  requestType: z.enum([
    "it_support",
    "maintenance",
    "office",
    "document_processing",
    "general",
  ]),
  department: departmentSchema,
  dateRequested: z
    .string()
    .min(1, "Date is required")
    .refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date format" }),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export const updateRequestSchema = createRequestSchema.extend({
  status: z.enum(["pending", "in_progress", "resolved", "closed", "cancelled"]),
});

export const requestFiltersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z
    .enum(["pending", "in_progress", "resolved", "closed", "cancelled", "all"])
    .optional(),
  requestType: z
    .enum([
      "it_support",
      "maintenance",
      "office",
      "document_processing",
      "general",
      "all",
    ])
    .optional(),
  department: z.union([departmentSchema, z.literal("all")]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent", "all"]).optional(),
  dateFrom: optionalDateSchema,
  dateTo: optionalDateSchema,
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type RequestFilters = z.infer<typeof requestFiltersSchema>;
