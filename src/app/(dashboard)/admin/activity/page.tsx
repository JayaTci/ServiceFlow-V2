import { redirect } from "next/navigation";
import { getAuthFailureRedirect, getCurrentUserContext } from "@backend/auth/current-user";
import { getRecentAccountAuditEvents } from "@backend/features/activities/account-audit-queries";
import { getRecentActivities } from "@backend/features/activities/queries";
import { AccountAuditList } from "@frontend/features/activities/components/account-audit-list";
import { ActivityTimeline } from "@frontend/features/activities/components/activity-timeline";

// Renders the admin-only global activity feed.
export default async function AdminActivityPage() {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) redirect(getAuthFailureRedirect(currentUser.reason));
  if (!currentUser.user.isAdmin) redirect("/dashboard");

  const [activities, accountEvents] = await Promise.all([
    getRecentActivities(100),
    getRecentAccountAuditEvents(100),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Activity Log</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Last 100 events across all requests</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Request Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Status changes, comments, assignments, and request deletes.
            </p>
          </div>
          <ActivityTimeline activities={activities} />
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Account Activity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              User creation, role changes, deactivations, and temporary password resets.
            </p>
          </div>
          <AccountAuditList events={accountEvents} />
        </div>
      </div>
    </div>
  );
}
