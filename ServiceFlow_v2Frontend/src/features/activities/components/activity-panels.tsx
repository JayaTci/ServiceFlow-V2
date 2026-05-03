"use client";

import { motion } from "framer-motion";
import { ActivityTimeline } from "@frontend/features/activities/components/activity-timeline";
import { AccountAuditList } from "@frontend/features/activities/components/account-audit-list";
import type { ActivityWithActor, AccountAuditEventWithUsers } from "@shared/types";

interface ActivityPanelsProps {
  activities: ActivityWithActor[];
  accountEvents: AccountAuditEventWithUsers[];
}

const panel = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] },
});

/** Side-by-side animated panels for the admin activity log. */
export function ActivityPanels({ activities, accountEvents }: ActivityPanelsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Request activity */}
      <motion.div
        {...panel(0.05)}
        className="relative rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-400" />
        <div className="px-6 py-5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-emerald-500 to-teal-400" />
            <h3 className="text-sm font-semibold text-foreground">Request Activity</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 ml-3.5">
            Status changes, comments, assignments, and request deletes.
          </p>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <ActivityTimeline activities={activities} />
        </div>
      </motion.div>

      {/* Account activity */}
      <motion.div
        {...panel(0.12)}
        className="relative rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-500 to-purple-400" />
        <div className="px-6 py-5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-violet-500 to-purple-400" />
            <h3 className="text-sm font-semibold text-foreground">Account Activity</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 ml-3.5">
            User creation, role changes, deactivations, and password resets.
          </p>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <AccountAuditList events={accountEvents} />
        </div>
      </motion.div>
    </div>
  );
}
