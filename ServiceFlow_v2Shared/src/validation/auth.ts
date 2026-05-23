import { z } from "zod";
import { DEPARTMENTS } from "@shared/constants/departments";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(100),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  department: z
    .string()
    .optional()
    .refine((value) => !value || DEPARTMENTS.includes(value as (typeof DEPARTMENTS)[number]), {
      message: "Invalid department",
    }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
