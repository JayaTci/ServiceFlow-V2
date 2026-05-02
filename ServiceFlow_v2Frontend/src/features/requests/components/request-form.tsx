"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";
import { Textarea } from "@frontend/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frontend/components/ui/select";
import {
  updateRequestSchema,
  type UpdateRequestInput,
} from "@shared/validation/request";
import { DEPARTMENTS, PRIORITY_LABELS, REQUEST_TYPE_LABELS, STATUS_LABELS } from "@shared/constants/requests";
import type { RequestType, Priority, Status } from "@database/schema";

type FormMode = "create" | "edit";

interface RequestFormProps {
  mode: FormMode;
  defaultValues?: Partial<UpdateRequestInput>;
  onSubmit: (data: UpdateRequestInput) => Promise<void>;
  loading?: boolean;
}

const REQUEST_TYPES = Object.entries(REQUEST_TYPE_LABELS) as [RequestType, string][];
const PRIORITIES = Object.entries(PRIORITY_LABELS) as [Priority, string][];
const STATUSES = Object.entries(STATUS_LABELS) as [Status, string][];

// Renders the create/edit request form with shared validation wiring.
export function RequestForm({ mode, defaultValues, onSubmit, loading }: RequestFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateRequestInput>({
    resolver: zodResolver(updateRequestSchema),
    defaultValues: {
      priority: "medium",
      status: "pending",
      dateRequested: new Date().toISOString().split("T")[0],
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" placeholder="Brief description of the request" {...register("title")} />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Detailed explanation of the request..."
            rows={3}
            {...register("description")}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Request Type *</Label>
          <Select
            defaultValue={defaultValues?.requestType}
            onValueChange={(val) => setValue("requestType", val as RequestType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {REQUEST_TYPES.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.requestType && <p className="text-xs text-red-500">{errors.requestType.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Department *</Label>
          <Select
            defaultValue={defaultValues?.department ?? undefined}
            onValueChange={(val) => setValue("department", val as string)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.department && <p className="text-xs text-red-500">{errors.department.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Priority *</Label>
          <Select
            defaultValue={defaultValues?.priority ?? "medium"}
            onValueChange={(val) => setValue("priority", val as Priority)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {mode === "edit" && (
          <div className="space-y-1.5">
            <Label>Status *</Label>
            <Select
              defaultValue={defaultValues?.status ?? "pending"}
              onValueChange={(val) => setValue("status", val as Status)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="dateRequested">Date Requested *</Label>
          <Input
            id="dateRequested"
            type="date"
            {...register("dateRequested")}
          />
          {errors.dateRequested && <p className="text-xs text-red-500">{errors.dateRequested.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {mode === "create" ? "Submit Request" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
