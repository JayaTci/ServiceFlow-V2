"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Shield, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { setUserActive, setUserTemporaryPassword, updateUserRole } from "@backend/features/users/actions";
import { Button } from "@frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@frontend/components/ui/dialog";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";
import type { Role } from "@database/schema";

interface UserActionsProps {
  userId: number;
  currentRole: Role;
  currentUserId: string;
  currentUserRole: Role;
  isActive: boolean;
  mustChangePassword: boolean;
}

// Renders admin controls for changing a user's role, status, and temporary password.
export function UserActions({
  userId,
  currentRole,
  currentUserId,
  currentUserRole,
  isActive,
}: UserActionsProps) {
  const router = useRouter();
  const [stateDialog, setStateDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isSelf = String(userId) === currentUserId;
  const canToggleRole =
    currentUserRole === "superadmin" && (currentRole === "user" || currentRole === "admin");
  const nextRole: Role = currentRole === "admin" ? "user" : "admin";

  const toggleRole = async () => {
    setLoading(true);
    const result = await updateUserRole(userId, nextRole);
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message ?? `Role updated to ${nextRole}`);
      router.refresh();
    }
  };

  const handleAccessChange = async () => {
    setLoading(true);
    const result = await setUserActive(userId, !isActive);
    setLoading(false);
    setStateDialog(false);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(result.message ?? "User access updated");
      router.refresh();
    }
  };

  const handleTemporaryPassword = async () => {
    setLoading(true);
    const result = await setUserTemporaryPassword(userId, temporaryPassword);
    setLoading(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }

    setPasswordDialog(false);
    setTemporaryPassword("");
    toast.success(result.message ?? "Temporary password set");
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {!isSelf && canToggleRole && (
          <Button variant="ghost" size="sm" onClick={toggleRole} disabled={loading} className="text-xs">
            {currentRole === "admin" ? (
              <>
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Demote
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                Promote
              </>
            )}
          </Button>
        )}
        {!isSelf && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setPasswordDialog(true)}
              disabled={loading}
            >
              <KeyRound className="w-3.5 h-3.5 mr-1.5" />
              Temp Password
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setStateDialog(true)}
              disabled={loading}
            >
              {isActive ? (
                <>
                  <UserX className="w-3.5 h-3.5 mr-1.5" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                  Reactivate
                </>
              )}
            </Button>
          </>
        )}
      </div>

      <Dialog open={stateDialog} onOpenChange={setStateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isActive ? "Deactivate User" : "Reactivate User"}</DialogTitle>
            <DialogDescription>
              {isActive
                ? "The user will lose access immediately, but their requests and history will remain."
                : "The user will be allowed to sign in again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStateDialog(false)}>
              Cancel
            </Button>
            <Button variant={isActive ? "destructive" : "default"} onClick={handleAccessChange} disabled={loading}>
              {loading ? "Saving..." : isActive ? "Deactivate User" : "Reactivate User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Temporary Password</DialogTitle>
            <DialogDescription>
              The user will be forced to change this password the next time they sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`temporary-password-${userId}`}>Temporary Password</Label>
            <Input
              id={`temporary-password-${userId}`}
              type="password"
              value={temporaryPassword}
              onChange={(event) => setTemporaryPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTemporaryPassword} disabled={loading || temporaryPassword.trim().length < 8}>
              {loading ? "Saving..." : "Set Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
