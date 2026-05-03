"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, TriangleAlert, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { updateProfile } from "@backend/features/auth/actions";
import { Avatar, AvatarFallback } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frontend/components/ui/select";
import { DEPARTMENTS } from "@shared/constants/departments";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  department: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// Renders profile settings and submits profile/password updates.
export default function ProfilePage() {
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const user = session?.user;
  const mustChangePassword = Boolean(user?.mustChangePassword);
  const showForcedBanner = mustChangePassword || searchParams.get("forcePasswordChange") === "1";

  const initials = user?.name
    ? user.name.split(" ").map((segment) => segment[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const {
    register: registerProfile,
    handleSubmit: submitProfile,
    setValue: setProfileValue,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "", department: user?.department ?? "" },
  });

  const {
    register: registerPassword,
    handleSubmit: submitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileLoading(true);
    const result = await updateProfile({
      name: data.name,
      department: data.department || null,
    });
    setProfileLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    await update({
      name: data.name,
      department: data.department || null,
      mustChangePassword,
    });
    toast.success("Profile updated.");
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (!user?.name) return;
    setPwLoading(true);
    const result = await updateProfile({
      name: user.name,
      department: user.department ?? null,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    setPwLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    resetPasswordForm();
    toast.success("Password updated. Please sign in again.");
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Update your name, department, and password</p>
      </div>

      {showForcedBanner && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-3">
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Password change required</p>
            <p className="text-amber-800/90 mt-0.5">
              Your account has a temporary password. Update it now before continuing anywhere else.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
        <Avatar className="w-14 h-14">
          <AvatarFallback className="text-lg font-bold bg-primary/15 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-primary mt-0.5 capitalize font-medium">{user?.role}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <User className="w-4 h-4 text-muted-foreground" />
          Personal info
        </div>

        <form onSubmit={submitProfile(onProfileSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...registerProfile("name")} />
            {profileErrors.name && (
              <p className="text-xs text-destructive">{profileErrors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept">Department</Label>
            <Select
              defaultValue={user?.department ?? ""}
              onValueChange={(value) => setProfileValue("department", value as string | undefined)}
            >
              <SelectTrigger id="dept">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" size="sm" disabled={profileLoading || mustChangePassword}>
            {profileLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save changes
          </Button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock className="w-4 h-4 text-muted-foreground" />
          Change password
        </div>

        <form onSubmit={submitPassword(onPasswordSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" {...registerPassword("currentPassword")} />
            {passwordErrors.currentPassword && (
              <p className="text-xs text-destructive">{passwordErrors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" {...registerPassword("newPassword")} />
            {passwordErrors.newPassword && (
              <p className="text-xs text-destructive">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" type="password" {...registerPassword("confirmPassword")} />
            {passwordErrors.confirmPassword && (
              <p className="text-xs text-destructive">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" size="sm" disabled={pwLoading}>
            {pwLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
}
