"use client";

import { motion } from "framer-motion";
import { Shield, UserCheck, UserX, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@frontend/components/ui/avatar";
import { Badge } from "@frontend/components/ui/badge";
import { UserActions } from "@frontend/features/users/components/user-actions";
import { formatDate } from "@shared/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date | string;
  department?: string | null;
}

interface UsersTableProps {
  users: User[];
  currentUserId: string;
  currentUserRole: string;
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const row = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

function formatRoleLabel(role: string): string {
  if (role === "superadmin") return "Superadmin";
  if (role === "admin") return "Admin";
  return "User";
}

/** Animated user management table with stagger row entrance. */
export function UsersTable({ users, currentUserId, currentUserRole }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Users className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No users yet</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Create the first account above.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_160px_auto] items-center px-5 py-3 bg-muted/40 border-b border-border">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">User</span>
        <span className="hidden sm:block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Access</span>
        <span className="hidden sm:block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Joined</span>
        <span />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="divide-y divide-border/50"
      >
        {users.map((user) => {
          const initials  = user.name.split(" ").filter(Boolean).map((s) => s[0]).join("").toUpperCase().slice(0, 2);
          const isElevated = user.role === "admin" || user.role === "superadmin";

          return (
            <motion.div
              key={user.id}
              variants={row}
              className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_160px_auto] items-center px-5 py-4 hover:bg-muted/20 transition-colors group"
            >
              {/* User identity */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  {isElevated && (
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-emerald-500/40 to-teal-500/40 blur-sm" />
                  )}
                  <Avatar className={`relative w-9 h-9 ${isElevated ? "ring-2 ring-primary/25" : ""}`}>
                    <AvatarFallback
                      className={
                        isElevated
                          ? "text-xs font-semibold bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-primary"
                          : "text-xs font-semibold bg-muted text-muted-foreground"
                      }
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground truncate">
                    {user.name}
                    {isElevated && <Shield className="w-3 h-3 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                    {user.department && (
                      <span className="ml-1 text-muted-foreground/50">· {user.department}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Badge
                      variant="secondary"
                      className={
                        isElevated
                          ? "text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
                          : "text-[10px] px-1.5 py-0 bg-muted text-muted-foreground border-border"
                      }
                    >
                      {formatRoleLabel(user.role)}
                    </Badge>
                    {user.isActive ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 text-emerald-600 border-emerald-500/25 bg-emerald-500/5">
                        <UserCheck className="w-2.5 h-2.5" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 text-amber-600 border-amber-500/25 bg-amber-500/5">
                        <UserX className="w-2.5 h-2.5" />
                        Inactive
                      </Badge>
                    )}
                    {user.mustChangePassword && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                        Password reset pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground">
                  {user.isActive ? "Has access" : "Blocked from login"}
                </p>
              </div>

              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</p>
              </div>

              <UserActions
                userId={user.id}
                currentRole={user.role as "user" | "admin" | "superadmin"}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole as "user" | "admin" | "superadmin"}
                isActive={user.isActive}
                mustChangePassword={user.mustChangePassword}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
