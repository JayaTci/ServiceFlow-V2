import { redirect } from "next/navigation";
import { getAuthFailureRedirect, getCurrentUserContext } from "@backend/auth/current-user";
import {
  getCountByDepartment,
  getCountByPriority,
  getCountByStatus,
  getCountByType,
  getDashboardStats,
} from "@backend/features/reports/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@frontend/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@frontend/components/ui/tabs";
import { SimpleBarChart } from "@frontend/features/dashboard/components/bar-chart";
import { StatusChart } from "@frontend/features/dashboard/components/status-chart";
import { DateRangeFilter } from "@frontend/features/reports/components/date-range-filter";

interface SearchParams {
  dateFrom?: string;
  dateTo?: string;
}

// Renders aggregate request reporting for the selected date range.
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) redirect(getAuthFailureRedirect(currentUser.reason));

  const { dateFrom, dateTo } = await searchParams;

  const [stats, byStatus, byType, byDept, byPriority] = await Promise.all([
    getDashboardStats(dateFrom, dateTo),
    getCountByStatus(dateFrom, dateTo),
    getCountByType(dateFrom, dateTo),
    getCountByDepartment(dateFrom, dateTo),
    getCountByPriority(dateFrom, dateTo),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analyze and track service request patterns
          </p>
        </div>
        <DateRangeFilter dateFrom={dateFrom} dateTo={dateTo} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: stats.total, color: "text-blue-600" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600" },
          { label: "In Progress", value: stats.inProgress, color: "text-blue-500" },
          { label: "Resolved", value: stats.resolved, color: "text-green-600" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">By Status</TabsTrigger>
          <TabsTrigger value="type">By Type</TabsTrigger>
          <TabsTrigger value="department">By Department</TabsTrigger>
          <TabsTrigger value="priority">By Priority</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusChart data={byStatus} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportTable data={byStatus} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="type" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Requests by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={byType} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportTable data={byType} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="department" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Requests by Department</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={byDept} color="#8b5cf6" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Department Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportTable data={byDept} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="priority" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Requests by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={byPriority} color="#f59e0b" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Priority Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportTable data={byPriority} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportTable({ data }: { data: { label: string; count: number }[] }) {
  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-2">
      {data.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
        >
          <span className="text-foreground">{row.label}</span>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs">
              {total > 0 ? ((row.count / total) * 100).toFixed(0) : 0}%
            </span>
            <span className="font-semibold text-foreground w-8 text-right">{row.count}</span>
          </div>
        </div>
      ))}
      {data.length > 0 && (
        <div className="flex items-center justify-between text-sm py-1.5 font-semibold">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">{total}</span>
        </div>
      )}
    </div>
  );
}
