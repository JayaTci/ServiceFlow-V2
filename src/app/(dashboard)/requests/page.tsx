import { auth } from "@backend/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@shared/utils";
import { buttonVariants } from "@frontend/components/ui/button";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frontend/components/ui/select";
import { RequestTable } from "@frontend/features/requests/components/request-table";
import { STATUS_LABELS, REQUEST_TYPE_LABELS, PRIORITY_LABELS, DEPARTMENTS } from "@shared/constants/requests";
import { getRequests } from "@backend/features/requests/queries";
import { requestFiltersSchema } from "@shared/validation/request";
import type { Status, RequestType, Priority } from "@database/schema";

interface SearchParams {
  search?: string;
  status?: string;
  requestType?: string;
  department?: string;
  priority?: string;
  page?: string;
}

const ACTIVE_FILTER_KEYS = ["status", "requestType", "department", "priority"] as const;

// Renders the authenticated request list with filters and pagination.
export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const filters = requestFiltersSchema.parse(params);
  const isAdmin = session.user.role === "admin";

  const result = await getRequests(filters, session.user.id, isAdmin);

  const totalPages = result.totalPages;
  const currentPage = filters.page;

  const activeFilters = ACTIVE_FILTER_KEYS.filter(
    (k) => params[k] && params[k] !== "all"
  ).length + (params.search ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Requests</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result.total} request{result.total !== 1 ? "s" : ""}
            {activeFilters > 0 && (
              <span className="ml-1 text-primary">· {activeFilters} filter{activeFilters !== 1 ? "s" : ""} active</span>
            )}
          </p>
        </div>
        <Link href="/requests/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
          <Plus className="w-4 h-4" />
          New Request
        </Link>
      </div>

      {/* Filter bar */}
      <form className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            name="search"
            defaultValue={params.search}
            placeholder="Search requests..."
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Status chip */}
        <Select name="status" defaultValue={params.status ?? "all"}>
          <SelectTrigger className="h-8 text-xs w-[130px] gap-1">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority chip */}
        <Select name="priority" defaultValue={params.priority ?? "all"}>
          <SelectTrigger className="h-8 text-xs w-[120px] gap-1">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type chip */}
        <Select name="requestType" defaultValue={params.requestType ?? "all"}>
          <SelectTrigger className="h-8 text-xs w-[140px] gap-1">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.entries(REQUEST_TYPE_LABELS) as [RequestType, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Department chip */}
        <Select name="department" defaultValue={params.department ?? "all"}>
          <SelectTrigger className="h-8 text-xs w-[140px] gap-1">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button type="submit" size="sm" variant="secondary" className="h-8 gap-1.5 text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Apply
        </Button>

        {activeFilters > 0 && (
          <Link
            href="/requests"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 text-xs text-muted-foreground")}
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <RequestTable
        data={result.data}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p>Page {currentPage} of {totalPages} · {result.total} results</p>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/requests?${new URLSearchParams({ ...params, page: String(currentPage - 1) })}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/requests?${new URLSearchParams({ ...params, page: String(currentPage + 1) })}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
