import { z } from "zod";

export const createRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requestType: z.enum([
    "it_support",
    "maintenance",
    "office",
    "document_processing",
    "general",
  ]),
  department: z.string().min(1, "Department is required"),
  dateRequested: z.string().min(1, "Date is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export const updateRequestSchema = createRequestSchema.extend({
  status: z.enum(["pending", "in_progress", "resolved", "closed", "cancelled"]),
});

export const requestFiltersSchema = z.object({
  search: z.string().optional(),
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
  department: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent", "all"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type RequestFilters = z.infer<typeof requestFiltersSchema>;
