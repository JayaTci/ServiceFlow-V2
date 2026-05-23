"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { assignRequest } from "@backend/features/requests/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frontend/components/ui/select";

type AssignableUser = {
  id: number;
  name: string;
  email: string;
};

export function AssigneeControl({
  requestId,
  assigneeId,
  users,
}: {
  requestId: number;
  assigneeId: number | null;
  users: AssignableUser[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(assigneeId === null ? "unassigned" : String(assigneeId));
  const [loading, setLoading] = useState(false);

  const updateAssignee = async (nextValue: string | null) => {
    if (!nextValue) return;
    setValue(nextValue);
    setLoading(true);
    const result = await assignRequest(
      requestId,
      nextValue === "unassigned" ? null : Number.parseInt(nextValue, 10)
    );
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      setValue(assigneeId === null ? "unassigned" : String(assigneeId));
      return;
    }

    toast.success("Assignee updated");
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <UserRoundCheck className="h-3.5 w-3.5" />
        Assignee
      </div>
      <Select value={value} onValueChange={updateAssignee} disabled={loading}>
        <SelectTrigger className="h-9 w-full text-xs">
          <SelectValue placeholder="Assign request" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={String(user.id)}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
