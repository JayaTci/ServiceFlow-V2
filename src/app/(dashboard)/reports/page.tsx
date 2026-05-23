import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthFailureRedirect, getCurrentUserContext } from "@backend/auth/current-user";
import {
  getCountByDepartment,
  getCountByPriority,
  getCountByStatus,
  getCountByType,
  getDashboardStats,
} from "@backend/features/reports/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@frontend/components/ui/tabs";
import { SimpleBarChart } from "@frontend/features/dashboard/components/bar-chart";
import { StatusChart } from "@frontend/features/dashboard/components/status-chart";
import { DateRangeFilter } from "@frontend/features/reports/components/date-range-filter";
import { ReportsHero } from "@frontend/features/reports/components/reports-hero";

interface SearchParams {
  dateFrom?: string;
  dateTo?: string;
}

const optionalDateSchema = z
  .string()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)));

const reportsSearchParamsSchema = z.object({
  dateFrom: optionalDateSchema,
  dateTo: optionalDateSchema,
});

// Renders aggregate request reporting for the selected date range.
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) redirect(getAuthFailureRedirect(currentUser.reason));
  if (!currentUser.user.isAdmin) redirect("/dashboard");

  const parsedParams = reportsSearchParamsSchema.safeParse(await searchParams);
  const { dateFrom, dateTo } = parsedParams.success ? parsedParams.data : {};

  const [stats, byStatus, byType, byDept, byPriority] = await Promise.all([
    getDashboardStats(dateFrom, dateTo, currentUser.user.sessionUserId, currentUser.user.isAdmin),
    getCountByStatus(dateFrom, dateTo, currentUser.user.sessionUserId, currentUser.user.isAdmin),
    getCountByType(dateFrom, dateTo, currentUser.user.sessionUserId, currentUser.user.isAdmin),
    getCountByDepartment(dateFrom, dateTo, currentUser.user.sessionUserId, currentUser.user.isAdmin),
    getCountByPriority(dateFrom, dateTo, currentUser.user.sessionUserId, currentUser.user.isAdmin),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Reports &amp;{" "}
            <span
              style={{ WebkitBackgroundClip: "text", backgroundClip: "text" }}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent"
            >
              Analytics
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analyze and track service request patterns
          </p>
        </div>
        <DateRangeFilter dateFrom={dateFrom} dateTo={dateTo} />
      </div>

      <ReportsHero stats={stats} />

      <Tabs defaultValue="status">
        <TabsList className="bg-muted/60 p-1 rounded-xl gap-0.5">
          <TabsTrigger value="status" className="rounded-lg text-xs font-medium">By Status</TabsTrigger>
          <TabsTrigger value="type" className="rounded-lg text-xs font-medium">By Type</TabsTrigger>
          <TabsTrigger value="department" className="rounded-lg text-xs font-medium">By Department</TabsTrigger>
          <TabsTrigger value="priority" className="rounded-lg text-xs font-medium">By Priority</TabsTrigger>
        </TabsList>

        {[
          {
            value: "status",
            title: "Status Distribution",
            tableTitle: "Status Breakdown",
            chart: <StatusChart data={byStatus} />,
            data: byStatus,
            color: undefined,
          },
          {
            value: "type",
            title: "Requests by Type",
            tableTitle: "Type Breakdown",
            chart: <SimpleBarChart data={byType} />,
            data: byType,
            color: undefined,
          },
          {
            value: "department",
            title: "Requests by Department",
            tableTitle: "Department Breakdown",
            chart: <SimpleBarChart data={byDept} color="#8b5cf6" />,
            data: byDept,
            color: "#8b5cf6",
          },
          {
            value: "priority",
            title: "Requests by Priority",
            tableTitle: "Priority Breakdown",
            chart: <SimpleBarChart data={byPriority} color="#f59e0b" />,
            data: byPriority,
            color: "#f59e0b",
          },
        ].map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border/60">
                  <p className="text-sm font-semibold text-foreground">{tab.title}</p>
                </div>
                <div className="p-5">{tab.chart}</div>
              </div>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-5 py-4 border-b border-border/60">
                  <p className="text-sm font-semibold text-foreground">{tab.tableTitle}</p>
                </div>
                <div className="p-5">
                  <ReportTable data={tab.data} accentColor={tab.color} />
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ReportTable({
  data,
  accentColor,
}: {
  data: { label: string; count: number }[];
  accentColor?: string;
}) {
  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-2.5">
      {data.map((row) => {
        const pct = total > 0 ? (row.count / total) * 100 : 0;
        return (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">{row.label}</span>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                <span className="font-semibold text-foreground tabular-nums w-6 text-right">
                  {row.count}
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: accentColor
                    ? accentColor
                    : "linear-gradient(to right, var(--color-emerald-500), var(--color-teal-400, #2dd4bf))",
                }}
              />
            </div>
          </div>
        );
      })}
      {data.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-border/60 text-sm font-semibold">
          <span className="text-foreground">Total</span>
          <span className="text-foreground tabular-nums">{total}</span>
        </div>
      )}
    </div>
  );
}
