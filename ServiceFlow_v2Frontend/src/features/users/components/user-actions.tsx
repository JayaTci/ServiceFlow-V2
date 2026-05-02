"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@frontend/components/ui/dialog";
import { deleteUser, updateUserRole } from "@backend/features/users/actions";
import type { Role } from "@database/schema";

interface UserActionsProps {
  userId: number;
  currentRole: Role;
  currentUserId: string;
}

// Renders admin controls for changing a user's role or deleting the user.
export function UserActions({ userId, currentRole, currentUserId }: UserActionsProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSelf = String(userId) === currentUserId;

  const toggleRole = async () => {
    const newRole: Role = currentRole === "admin" ? "user" : "admin";
    setLoading(true);
    const result = await updateUserRole(userId, newRole);
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Role updated to ${newRole}`);
      router.refresh();
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteUser(userId);
    setLoading(false);
    setDeleteOpen(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("User deleted");
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {!isSelf && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleRole}
              disabled={loading}
              className="text-xs"
            >
              {currentRole === "admin" ? (
                <><Shield className="w-3.5 h-3.5 mr-1.5" /> Demote</>
              ) : (
                <><ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Promote</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
              disabled={loading}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This will permanently delete the user account. Their requests will remain in the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
