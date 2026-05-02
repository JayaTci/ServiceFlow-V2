"use client";

import { useRouter } from "next/navigation";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";
import { Button } from "@frontend/components/ui/button";

interface DateRangeFilterProps {
  dateFrom?: string;
  dateTo?: string;
}

// Renders report date filters and syncs them to query parameters.
export function DateRangeFilter({ dateFrom, dateTo }: DateRangeFilterProps) {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const from = data.get("dateFrom") as string;
    const to = data.get("dateTo") as string;

    const params = new URLSearchParams();
    if (from) params.set("dateFrom", from);
    if (to) params.set("dateTo", to);

    router.push(`/reports?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">From</Label>
        <Input type="date" name="dateFrom" defaultValue={dateFrom} className="w-36 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">To</Label>
        <Input type="date" name="dateTo" defaultValue={dateTo} className="w-36 text-sm" />
      </div>
      <Button type="submit" variant="outline" size="sm">Apply</Button>
      {(dateFrom || dateTo) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push("/reports")}
        >
          Clear
        </Button>
      )}
    </form>
  );
}
