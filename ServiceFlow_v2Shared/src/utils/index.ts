import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export {
  DEPARTMENTS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  REQUEST_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@shared/constants/requests";

/** Merges conditional class names and resolves Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generates a stable human-readable service request code for a yearly sequence. */
export function generateRequestCode(year: number, count: number): string {
  return `SR-${year}-${String(count).padStart(4, "0")}`;
}

/** Formats persisted date values for compact UI display. */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
