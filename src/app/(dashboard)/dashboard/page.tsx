import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { getAuthFailureRedirect, getCurrentUserContext } from "@backend/auth/current-user";
import { ActivityTimeline } from "@frontend/features/activities/components/activity-timeline";
import { SummaryCards } from "@frontend/features/dashboard/components/summary-cards";
import { SimpleBarChart } from "@frontend/features/dashboard/components/bar-chart";
import { StatusChart } from "@frontend/features/dashboard/components/status-chart";
import { PriorityBadge, StatusBadge } from "@frontend/features/requests/components/status-badge";
import { buttonVariants } from "@frontend/components/ui/button";
import { getRecentActivities } from "@backend/features/activities/queries";
import { getRequests } from "@backend/features/requests/queries";
import {
  getCountByDepartment,
  getCountByStatus,
  getCountByType,
  getDashboardStats,
  getMonthlyTrend,
} from "@backend/features/reports/queries";
import { cn, formatDate } from "@shared/utils";

// Renders the authenticated dashboard summary and recent activity.
export default async function DashboardPage() {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) redirect(getAuthFailureRedirect(currentUser.reason));

  const [stats, byStatus, byType, byDept, trend, recentRequests, recentActivities] =
    await Promise.all([
      getDashboardStats(),
      getCountByStatus(),
      getCountByType(),
      getCountByDepartment(),
      getMonthlyTrend(),
      getRequests({ pageSize: 5 }, currentUser.user.sessionUserId, currentUser.user.isAdmin),
      getRecentActivities(8),
    ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Welcome back, {currentUser.user.name.split(" ")[0]}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here&apos;s what&apos;s happening with your requests today.
          </p>
        </div>
        <Link href="/requests/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
          <Plus className="w-4 h-4" />
          New Request
        </Link>
      </div>

      <SummaryCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-4">By Status</p>
          <StatusChart data={byStatus} />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-4">By Request Type</p>
          <SimpleBarChart data={byType} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-4">By Department</p>
          <SimpleBarChart data={byDept} color="#8b5cf6" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Monthly Trend</p>
          <SimpleBarChart
            data={trend.map((item) => ({ label: item.month, value: item.month, count: item.count }))}
            color="#10b981"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Recent Requests</p>
            <Link
              href="/requests"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {recentRequests.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No requests yet.</p>
            ) : (
              recentRequests.data.map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-sm font-medium text-foreground truncate">{request.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">{request.requestCode}</span>
                      {" · "}
                      {request.requestedBy.name}
                      {" · "}
                      {formatDate(request.dateRequested)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <PriorityBadge priority={request.priority} />
                    <StatusBadge status={request.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Recent Activity</p>
            {currentUser.user.isAdmin && (
              <Link
                href="/admin/activity"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <div className="p-5">
            <ActivityTimeline activities={recentActivities} />
          </div>
        </div>
      </div>
    </div>
  );
}
