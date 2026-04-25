import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { SimpleBarChart } from "@/components/dashboard/bar-chart";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { StatusBadge, PriorityBadge } from "@/components/requests/status-badge";
import {
  getDashboardStats,
  getCountByStatus,
  getCountByType,
  getCountByDepartment,
  getMonthlyTrend,
} from "@/lib/queries/reports";
import { getRequests } from "@/lib/queries/requests";
import { getRecentActivities } from "@/lib/queries/activities";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "admin";

  const [stats, byStatus, byType, byDept, trend, recentRequests, recentActivities] =
    await Promise.all([
      getDashboardStats(),
      getCountByStatus(),
      getCountByType(),
      getCountByDepartment(),
      getMonthlyTrend(),
      getRequests({ pageSize: 5 }, session.user.id, isAdmin),
      getRecentActivities(8),
    ]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Welcome back, {session.user.name?.split(" ")[0]}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's what's happening with your requests today.
          </p>
        </div>
        <Link href="/requests/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
          <Plus className="w-4 h-4" />
          New Request
        </Link>
      </div>

      {/* KPI cards */}
      <SummaryCards stats={stats} />

      {/* Charts row */}
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
            data={trend.map((t) => ({ label: t.month, value: t.month, count: t.count }))}
            color="#10b981"
          />
        </div>
      </div>

      {/* Recent requests + activity feed */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        {/* Recent requests */}
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
              recentRequests.data.map((req) => (
                <Link
                  key={req.id}
                  href={`/requests/${req.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-sm font-medium text-foreground truncate">{req.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">{req.requestCode}</span>
                      {" · "}
                      {req.requestedBy.name}
                      {" · "}
                      {formatDate(req.dateRequested)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <PriorityBadge priority={req.priority} />
                    <StatusBadge status={req.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Recent Activity</p>
            {isAdmin && (
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
