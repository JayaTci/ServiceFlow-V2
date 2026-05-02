import { auth } from "@backend/auth/config";
import { redirect } from "next/navigation";
import { ActivityTimeline } from "@frontend/features/activities/components/activity-timeline";
import { getRecentActivities } from "@backend/features/activities/queries";

// Renders the admin-only global activity feed.
export default async function AdminActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const activities = await getRecentActivities(100);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Activity Log</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Last 100 events across all requests
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <ActivityTimeline activities={activities} />
      </div>
    </div>
  );
}
