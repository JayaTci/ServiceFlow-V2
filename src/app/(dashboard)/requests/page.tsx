import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getAuthFailureRedirect, getCurrentUserContext } from "@backend/auth/current-user";
import { getRequests } from "@backend/features/requests/queries";
import { buttonVariants } from "@frontend/components/ui/button";
import { RequestTable } from "@frontend/features/requests/components/request-table";
import { RequestsFilters } from "@frontend/features/requests/components/requests-filters";
import { DEPARTMENTS, PRIORITY_LABELS, REQUEST_TYPE_LABELS, STATUS_LABELS } from "@shared/constants/requests";
import { cn } from "@shared/utils";
import { requestFiltersSchema } from "@shared/validation/request";
import type { Priority, RequestType, Status } from "@database/schema";

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
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) redirect(getAuthFailureRedirect(currentUser.reason));

  const params  = await searchParams;
  const filters = requestFiltersSchema.parse(params);
  const result  = await getRequests(
    filters,
    currentUser.user.sessionUserId,
    currentUser.user.isAdmin
  );

  const activeFilters =
    ACTIVE_FILTER_KEYS.filter((key) => params[key] && params[key] !== "all").length +
    (params.search ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Requests</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result.total} request{result.total !== 1 ? "s" : ""}
            {activeFilters > 0 && (
              <span className="ml-1 text-primary font-medium">
                · {activeFilters} filter{activeFilters !== 1 ? "s" : ""} active
              </span>
            )}
          </p>
        </div>
        <Link href="/requests/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shadow-sm shadow-primary/20")}>
          <Plus className="w-4 h-4" />
          New Request
        </Link>
      </div>

      {/* Animated filter bar */}
      <RequestsFilters
        params={params}
        activeFilters={activeFilters}
        statusLabels={Object.entries(STATUS_LABELS) as [Status, string][]}
        priorityLabels={Object.entries(PRIORITY_LABELS) as [Priority, string][]}
        typeLabels={Object.entries(REQUEST_TYPE_LABELS) as [RequestType, string][]}
        departments={DEPARTMENTS}
      />

      {/* Table */}
      <RequestTable
        data={result.data}
        currentUserId={currentUser.user.sessionUserId}
        isAdmin={currentUser.user.isAdmin}
      />

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p>
            Page {filters.page} of {result.totalPages} · {result.total} results
          </p>
          <div className="flex gap-2">
            {filters.page > 1 && (
              <Link
                href={`/requests?${new URLSearchParams({ ...params, page: String(filters.page - 1) })}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}
              >
                Previous
              </Link>
            )}
            {filters.page < result.totalPages && (
              <Link
                href={`/requests?${new URLSearchParams({ ...params, page: String(filters.page + 1) })}`}
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
