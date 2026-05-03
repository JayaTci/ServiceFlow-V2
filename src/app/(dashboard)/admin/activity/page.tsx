import { redirect } from "next/navigation";
import { getAuthFailureRedirect, getCurrentUserContext } from "@backend/auth/current-user";
import { getRecentAccountAuditEvents } from "@backend/features/activities/account-audit-queries";
import { getRecentActivities } from "@backend/features/activities/queries";
import { ActivityPanels } from "@frontend/features/activities/components/activity-panels";

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
        <h2 className="text-xl font-bold text-foreground">
          Activity{" "}
          <span
            className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent"
            style={{ WebkitBackgroundClip: "text", backgroundClip: "text" }}
          >
            Log
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Last 100 events across all requests</p>
      </div>

      <ActivityPanels activities={activities} accountEvents={accountEvents} />
    </div>
  );
}
