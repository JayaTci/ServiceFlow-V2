"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  RefreshCw,
  UserCheck,
  UserX,
  MessageSquare,
  Trash2,
  Edit3,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@shared/utils";
import type { ActivityWithActor } from "@shared/types";
import type { ActivityAction } from "@database/schema";

const ACTION_CONFIG: Record<
  ActivityAction,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; dot: string }
> = {
  created:         { label: "created this request",    icon: Plus,          color: "bg-primary/10 text-primary",          dot: "border-primary/30" },
  status_changed:  { label: "updated the status",      icon: RefreshCw,     color: "bg-emerald-500/10 text-emerald-500",  dot: "border-emerald-500/30" },
  priority_changed:{ label: "changed the priority",    icon: Zap,           color: "bg-amber-500/10 text-amber-500",      dot: "border-amber-500/30" },
  assigned:        { label: "assigned this request",   icon: UserCheck,     color: "bg-emerald-500/10 text-emerald-500",  dot: "border-emerald-500/30" },
  unassigned:      { label: "unassigned this request", icon: UserX,         color: "bg-muted text-muted-foreground",      dot: "border-border" },
  updated:         { label: "updated this request",    icon: Edit3,         color: "bg-muted text-muted-foreground",      dot: "border-border" },
  commented:       { label: "left a comment",          icon: MessageSquare, color: "bg-violet-500/10 text-violet-500",    dot: "border-violet-500/30" },
  deleted:         { label: "deleted this request",    icon: Trash2,        color: "bg-destructive/10 text-destructive",  dot: "border-destructive/30" },
};

const listVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

const itemVariant = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

interface ActivityTimelineProps {
  activities: ActivityWithActor[];
}

// Renders request audit events in a staggered chronological timeline.
export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </div>
    );
  }

  const sorted = [...activities].reverse();

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="show"
      className="relative space-y-0"
    >
      {/* Gradient vertical line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/20 via-border to-transparent" />

      {sorted.map((activity, idx) => {
        const config = ACTION_CONFIG[activity.action] ?? ACTION_CONFIG.updated;
        const Icon = config.icon;
        const isLast = idx === sorted.length - 1;

        return (
          <motion.div
            key={activity.id}
            variants={itemVariant}
            className={cn("relative flex gap-4", !isLast && "pb-5")}
          >
            {/* Icon dot */}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border shrink-0",
                "bg-background",
                config.dot
              )}
            >
              <div className={cn("rounded-full p-1", config.color)}>
                <Icon className="w-3 h-3" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-sm text-foreground leading-snug">
                <span className="font-medium">{activity.actor.name}</span>{" "}
                <span className="text-muted-foreground">{config.label}</span>
              </p>

              {activity.oldValue && activity.newValue && (
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-muted text-muted-foreground line-through">
                    {activity.oldValue}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-primary/10 text-primary font-medium">
                    {activity.newValue}
                  </span>
                </div>
              )}

              <p className="mt-1 text-[11px] text-muted-foreground/60">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
