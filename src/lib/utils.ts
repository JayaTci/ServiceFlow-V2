import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Status, Priority, RequestType } from "@/lib/db/schema";
export { DEPARTMENTS } from "@/lib/config/departments";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRequestCode(year: number, count: number): string {
  return `SR-${year}-${String(count).padStart(4, "0")}`;
}

export const STATUS_LABELS: Record<Status, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<Status, string> = {
  pending:     "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  resolved:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  closed:      "bg-muted text-muted-foreground border-border",
  cancelled:   "bg-destructive/10 text-destructive border-destructive/20",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low:    "bg-muted text-muted-foreground border-border",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  high:   "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  it_support: "IT Support",
  maintenance: "Maintenance",
  office: "Office",
  document_processing: "Document Processing",
  general: "General",
};


export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
