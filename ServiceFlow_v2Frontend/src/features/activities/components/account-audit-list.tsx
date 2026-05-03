"use client";

import { formatDistanceToNow } from "date-fns";
import { KeyRound, Shield, UserCheck, UserPlus, UserX } from "lucide-react";
import type { AccountAuditAction } from "@database/schema";
import type { AccountAuditEventWithUsers } from "@shared/types";
import { cn } from "@shared/utils";

const ACTION_CONFIG: Record<
  AccountAuditAction,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  user_created: {
    label: "created an account for",
    icon: UserPlus,
    color: "bg-primary/10 text-primary",
  },
  role_changed: {
    label: "changed the role for",
    icon: Shield,
    color: "bg-blue-500/10 text-blue-500",
  },
  deactivated: {
    label: "deactivated",
    icon: UserX,
    color: "bg-destructive/10 text-destructive",
  },
  reactivated: {
    label: "reactivated",
    icon: UserCheck,
    color: "bg-emerald-500/10 text-emerald-500",
  },
  temporary_password_set: {
    label: "set a temporary password for",
    icon: KeyRound,
    color: "bg-amber-500/10 text-amber-500",
  },
};

interface AccountAuditListProps {
  events: AccountAuditEventWithUsers[];
}

export function AccountAuditList({ events }: AccountAuditListProps) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No account activity yet.</p>
      </div>
    );
  }

  const sorted = [...events].reverse();

  return (
    <div className="relative space-y-0">
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />

      {sorted.map((event, idx) => {
        const config = ACTION_CONFIG[event.action];
        const Icon = config.icon;
        const isLast = idx === sorted.length - 1;

        return (
          <div key={event.id} className={cn("relative flex gap-4", !isLast && "pb-5")}>
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border shrink-0",
                "bg-background"
              )}
            >
              <div className={cn("rounded-full p-1", config.color)}>
                <Icon className="w-3 h-3" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <p className="text-sm text-foreground">
                <span className="font-medium">{event.actor.name}</span>{" "}
                <span className="text-muted-foreground">{config.label}</span>{" "}
                <span className="font-medium">{event.targetUser.name}</span>
              </p>

              {(event.oldValue || event.newValue) && (
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  {event.oldValue && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground line-through">
                      {event.oldValue}
                    </span>
                  )}
                  {event.oldValue && event.newValue && (
                    <span className="text-xs text-muted-foreground">→</span>
                  )}
                  {event.newValue && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary font-medium">
                      {event.newValue}
                    </span>
                  )}
                </div>
              )}

              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
