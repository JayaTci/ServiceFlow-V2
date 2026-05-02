import { Badge } from "@frontend/components/ui/badge";
import { cn } from "@shared/utils";
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_COLORS, STATUS_LABELS } from "@shared/constants/requests";
import type { Status, Priority } from "@database/schema";

// Renders a color-coded request status badge.
export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium border", STATUS_COLORS[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// Renders a color-coded request priority badge.
export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium border", PRIORITY_COLORS[priority])}
    >
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
