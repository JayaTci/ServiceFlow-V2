"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ClipboardList, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { softDeleteRequest } from "@backend/features/requests/actions";
import { Button } from "@frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@frontend/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@frontend/components/ui/table";
import { PriorityBadge, StatusBadge } from "@frontend/features/requests/components/status-badge";
import { REQUEST_TYPE_LABELS } from "@shared/constants/requests";
import type { ServiceRequestWithUser } from "@shared/types";
import { formatDate } from "@shared/utils";

interface RequestTableProps {
  data: ServiceRequestWithUser[];
  currentUserId: string;
  isAdmin: boolean;
  onDeleted?: () => void;
}

const columnHelper = createColumnHelper<ServiceRequestWithUser>();

// Renders the request list table with row-level view/edit/delete actions.
export function RequestTable({ data, currentUserId, isAdmin, onDeleted }: RequestTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const columns = [
    columnHelper.accessor("requestCode", {
      header: "Code",
      cell: (info) => (
        <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("title", {
      header: "Title",
      cell: (info) => (
        <Link
          href={`/requests/${info.row.original.id}`}
          className="font-medium text-foreground hover:text-blue-600 line-clamp-1"
        >
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor("requestType", {
      header: "Type",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">{REQUEST_TYPE_LABELS[info.getValue()]}</span>
      ),
    }),
    columnHelper.accessor("department", {
      header: "Department",
      cell: (info) => <span className="text-sm text-muted-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor("priority", {
      header: "Priority",
      cell: (info) => <PriorityBadge priority={info.getValue()} />,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor("dateRequested", {
      header: "Date",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">{formatDate(info.getValue())}</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const request = info.row.original;
        const canEdit = isAdmin || String(request.requestedById) === currentUserId;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted outline-none">
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/requests/${request.id}`)}>
                <Eye className="w-4 h-4 mr-2" /> View
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => router.push(`/requests/${request.id}?edit=true`)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(request.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const result = await softDeleteRequest(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Request deleted");
      onDeleted?.();
      router.refresh();
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider h-9 px-4"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <ClipboardList className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No requests found</p>
                      <p className="text-xs mt-0.5 text-muted-foreground/70">Try adjusting your filters</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors border-b border-border/60 last:border-0"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
