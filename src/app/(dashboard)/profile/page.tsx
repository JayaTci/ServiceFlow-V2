"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, TriangleAlert, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
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
  name:       z.string().min(2, "Name must be at least 2 characters"),
  department: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword:     z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ProfileForm  = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const sectionAnim = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

// Renders profile settings and submits profile/password updates.
export default function ProfilePage() {
  const searchParams   = useSearchParams();
  const { data: session, update } = useSession();
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading]           = useState(false);
  const user = session?.user;
  const mustChangePassword = Boolean(user?.mustChangePassword);
  const showForcedBanner   = mustChangePassword || searchParams.get("forcePasswordChange") === "1";

  const initials = user?.name
    ? user.name.split(" ").map((s) => s[0]).join("").toUpperCase().slice(0, 2)
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
    const result = await updateProfile({ name: data.name, department: data.department || null });
    setProfileLoading(false);
    if (result.error) { toast.error(result.error); return; }
    await update({ name: data.name, department: data.department || null, mustChangePassword });
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
    if (result.error) { toast.error(result.error); return; }
    resetPasswordForm();
    toast.success("Password updated. Please sign in again.");
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <motion.div
      variants={sectionAnim}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-xl"
    >
      {/* Page header */}
      <motion.div variants={slideUp}>
        <h2 className="text-xl font-bold text-foreground">
          Profile{" "}
          <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
            settings
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update your name, department, and password.
        </p>
      </motion.div>

      {/* Forced password banner */}
      {showForcedBanner && (
        <motion.div variants={slideUp}>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 flex gap-3">
            <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Password change required</p>
              <p className="text-amber-600 dark:text-amber-400/80 mt-0.5 text-xs">
                Your account has a temporary password. Update it before continuing.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Identity card */}
      <motion.div
        variants={slideUp}
        className="relative rounded-xl border border-border bg-card p-6 flex items-center gap-4 overflow-hidden"
      >
        {/* Background gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-400" />

        {/* Avatar with gradient ring */}
        <div className="relative shrink-0">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 opacity-30 blur-sm" />
          <Avatar className="relative w-14 h-14 ring-2 ring-primary/20">
            <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="relative">
          <p className="font-semibold text-foreground">{user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary capitalize">
            {user?.role}
          </span>
        </div>
      </motion.div>

      {/* Personal info */}
      <motion.div
        variants={slideUp}
        className="relative rounded-xl border border-border bg-card p-6 space-y-5 overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500/40 to-transparent" />

        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <User className="w-3.5 h-3.5 text-primary" />
          </div>
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
              onValueChange={(v) => setProfileValue("department", v as string | undefined)}
            >
              <SelectTrigger id="dept">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" size="sm" disabled={profileLoading || mustChangePassword} className="shadow-sm shadow-primary/20">
            {profileLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save changes
          </Button>
        </form>
      </motion.div>

      {/* Change password */}
      <motion.div
        variants={slideUp}
        className="relative rounded-xl border border-border bg-card p-6 space-y-5 overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-violet-500/40 to-transparent" />

        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <div className="p-1.5 rounded-lg bg-violet-500/10">
            <Lock className="w-3.5 h-3.5 text-violet-500" />
          </div>
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

          <Button type="submit" size="sm" disabled={pwLoading} className="shadow-sm shadow-violet-500/20">
            {pwLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Update password
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}
