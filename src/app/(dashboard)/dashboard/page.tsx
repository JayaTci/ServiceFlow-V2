import { redirect } from "next/navigation";
import { getAuthFailureRedirect, getCurrentUserContext } from "@backend/auth/current-user";
import { ActivityTimeline } from "@frontend/features/activities/components/activity-timeline";
import { SummaryCards } from "@frontend/features/dashboard/components/summary-cards";
import { SimpleBarChart } from "@frontend/features/dashboard/components/bar-chart";
import { StatusChart } from "@frontend/features/dashboard/components/status-chart";
import { PriorityBadge, StatusBadge } from "@frontend/features/requests/components/status-badge";
import { DashboardGreeting } from "@frontend/features/dashboard/components/dashboard-greeting";
import { AnimatedChartPanel } from "@frontend/features/dashboard/components/animated-chart-panel";
import { getRecentActivities } from "@backend/features/activities/queries";
import { getRequests } from "@backend/features/requests/queries";
import {
  getCountByDepartment,
  getCountByStatus,
  getCountByType,
  getDashboardStats,
  getMonthlyTrend,
} from "@backend/features/reports/queries";
import { formatDate } from "@shared/utils";

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
      <DashboardGreeting name={currentUser.user.name.split(" ")[0]} />

      <SummaryCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatedChartPanel title="By Status" delay={0.1}>
          <StatusChart data={byStatus} />
        </AnimatedChartPanel>
        <AnimatedChartPanel title="By Request Type" delay={0.15}>
          <SimpleBarChart data={byType} />
        </AnimatedChartPanel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatedChartPanel title="By Department" delay={0.2}>
          <SimpleBarChart data={byDept} color="#8b5cf6" />
        </AnimatedChartPanel>
        <AnimatedChartPanel title="Monthly Trend" delay={0.25}>
          <SimpleBarChart
            data={trend.map((item) => ({ label: item.month, value: item.month, count: item.count }))}
            color="#10b981"
          />
        </AnimatedChartPanel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        {/* Recent Requests */}
        <AnimatedChartPanel
          title="Recent Requests"
          delay={0.3}
          viewAllHref="/requests"
          className="p-0"
        >
          <div className="divide-y divide-border/50 -mx-5 -mb-5">
            {recentRequests.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10 px-5">
                No requests yet.
              </p>
            ) : (
              recentRequests.data.map((request) => (
                <a
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors group"
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {request.title}
                    </p>
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
                </a>
              ))
            )}
          </div>
        </AnimatedChartPanel>

        {/* Recent Activity */}
        <AnimatedChartPanel
          title="Recent Activity"
          delay={0.35}
          viewAllHref={currentUser.user.isAdmin ? "/admin/activity" : undefined}
          className="p-0"
        >
          <div className="-mx-5 -mb-5 px-5 pb-5">
            <ActivityTimeline activities={recentActivities} />
          </div>
        </AnimatedChartPanel>
      </div>
    </div>
  );
}
