"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Filter, Search, X } from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frontend/components/ui/select";
import { cn } from "@shared/utils";
import type { Priority, RequestType, Status } from "@database/schema";

interface SearchParams {
  search?: string;
  status?: string;
  requestType?: string;
  department?: string;
  priority?: string;
  page?: string;
}

interface RequestsFiltersProps {
  params: SearchParams;
  activeFilters: number;
  statusLabels: [Status, string][];
  priorityLabels: [Priority, string][];
  typeLabels: [RequestType, string][];
  departments: readonly string[];
}

const bar = {
  hidden: { opacity: 0, y: -12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

/** Animated filter bar for the requests list — handles search, selects, apply, and clear. */
export function RequestsFilters({
  params,
  activeFilters,
  statusLabels,
  priorityLabels,
  typeLabels,
  departments,
}: RequestsFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search,      setSearch]      = useState(params.search      ?? "");
  const [status,      setStatus]      = useState(params.status      ?? "all");
  const [requestType, setRequestType] = useState(params.requestType ?? "all");
  const [department,  setDepartment]  = useState(params.department  ?? "all");
  const [priority,    setPriority]    = useState(params.priority    ?? "all");

  /** Builds a query string from current filter state and navigates. */
  const apply = useCallback(() => {
    const next = new URLSearchParams();
    if (search)                        next.set("search",      search);
    if (status      && status      !== "all") next.set("status",      status);
    if (requestType && requestType !== "all") next.set("requestType", requestType);
    if (department  && department  !== "all") next.set("department",  department);
    if (priority    && priority    !== "all") next.set("priority",    priority);
    startTransition(() => router.push(`/requests?${next.toString()}`));
  }, [search, status, requestType, department, priority, router]);

  /** Clears all filters and returns to unfiltered list. */
  const clear = useCallback(() => {
    setSearch("");
    setStatus("all");
    setRequestType("all");
    setDepartment("all");
    setPriority("all");
    startTransition(() => router.push("/requests"));
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") apply();
  };

  return (
    <motion.div variants={bar} initial="hidden" animate="show">
      <div className="flex flex-wrap gap-2.5 items-end">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search requests…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8.5 h-8.5 text-xs"
          />
        </div>

        {/* Status */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8.5 w-[130px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {statusLabels.map(([val, label]) => (
              <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-8.5 w-[120px] text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All priorities</SelectItem>
            {priorityLabels.map(([val, label]) => (
              <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type */}
        <Select value={requestType} onValueChange={setRequestType}>
          <SelectTrigger className="h-8.5 w-[140px] text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All types</SelectItem>
            {typeLabels.map(([val, label]) => (
              <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Department */}
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="h-8.5 w-[140px] text-xs">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept} className="text-xs">{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {activeFilters > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
          <Button
            size="sm"
            onClick={apply}
            disabled={isPending}
            className={cn(
              "h-8.5 text-xs gap-1.5",
              isPending && "opacity-60 cursor-not-allowed",
            )}
          >
            <Filter className="w-3 h-3" />
            Apply
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
