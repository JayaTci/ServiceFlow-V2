"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, User, Lock } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@frontend/components/ui/avatar";
import { updateProfile } from "@backend/features/auth/actions";
import { DEPARTMENTS } from "@shared/constants/departments";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  department: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "At least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// Renders profile settings and submits profile/password updates.
export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    setValue: setProfileValue,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "", department: user?.department ?? "" },
  });

  const {
    register: regPw,
    handleSubmit: submitPw,
    reset: resetPw,
    formState: { errors: pwErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data: ProfileForm) => {
    if (!user?.id) return;
    setProfileLoading(true);
    const result = await updateProfile(parseInt(user.id), {
      name: data.name,
      department: data.department || null,
    });
    setProfileLoading(false);
    if (result.error) { toast.error(result.error); return; }
    await update({ name: data.name });
    toast.success("Profile updated.");
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (!user?.id) return;
    setPwLoading(true);
    const result = await updateProfile(parseInt(user.id), {
      name: user.name ?? "",
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    setPwLoading(false);
    if (result.error) { toast.error(result.error); return; }
    resetPw();
    toast.success("Password updated.");
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Update your name, department, and password</p>
      </div>

      {/* Avatar + identity card */}
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

      {/* Profile form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <User className="w-4 h-4 text-muted-foreground" />
          Personal info
        </div>

        <form onSubmit={submitProfile(onProfileSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" {...regProfile("name")} />
            {profileErrors.name && (
              <p className="text-xs text-destructive">{profileErrors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept">Department</Label>
            <Select
              defaultValue={user?.department ?? ""}
              onValueChange={(v) => setProfileValue("department", v as string | undefined)}
            >
              <SelectTrigger id="dept">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" size="sm" disabled={profileLoading}>
            {profileLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save changes
          </Button>
        </form>
      </div>

      {/* Password form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock className="w-4 h-4 text-muted-foreground" />
          Change password
        </div>

        <form onSubmit={submitPw(onPasswordSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" {...regPw("currentPassword")} />
            {pwErrors.currentPassword && (
              <p className="text-xs text-destructive">{pwErrors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" {...regPw("newPassword")} />
            {pwErrors.newPassword && (
              <p className="text-xs text-destructive">{pwErrors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" type="password" {...regPw("confirmPassword")} />
            {pwErrors.confirmPassword && (
              <p className="text-xs text-destructive">{pwErrors.confirmPassword.message}</p>
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
