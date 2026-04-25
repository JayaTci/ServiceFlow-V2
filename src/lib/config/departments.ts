/**
 * Canonical list of departments used throughout the application.
 * Defined here so it can be updated in one place without touching multiple files.
 */
export const DEPARTMENTS = [
  "IT",
  "HR",
  "Finance",
  "Operations",
  "Marketing",
  "Admin",
] as const;

export type Department = (typeof DEPARTMENTS)[number];
