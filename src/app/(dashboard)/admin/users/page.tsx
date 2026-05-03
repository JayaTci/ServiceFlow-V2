import { redirect } from "next/navigation";
import { Shield, UserCheck, UserX, Users } from "lucide-react";
import { getAuthFailureRedirect, getCurrentUserContext } from "@backend/auth/current-user";
import { formatRoleLabel } from "@backend/auth/rbac";
import { getAllUsers } from "@backend/features/users/queries";
import { Avatar, AvatarFallback } from "@frontend/components/ui/avatar";
import { Badge } from "@frontend/components/ui/badge";
import { CreateUserDialog } from "@frontend/features/users/components/create-user-dialog";
import { UserActions } from "@frontend/features/users/components/user-actions";
import { formatDate } from "@shared/utils";

// Renders the admin-only user management page.
export default async function AdminUsersPage() {
  const currentUser = await getCurrentUserContext();
  if (!currentUser.ok) redirect(getAuthFailureRedirect(currentUser.reason));
  if (!currentUser.user.isAdmin) redirect("/dashboard");

  const allUsers = await getAllUsers();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allUsers.length} account{allUsers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateUserDialog currentUserRole={currentUser.user.role} />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_160px_auto] items-center px-5 py-2.5 bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>User</span>
          <span className="hidden sm:block">Access</span>
          <span className="hidden sm:block">Joined</span>
          <span />
        </div>

        {allUsers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">No users yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {allUsers.map((user) => {
              const initials = user.name
                .split(" ")
                .filter(Boolean)
                .map((segment) => segment[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const isElevated = user.role === "admin" || user.role === "superadmin";

              return (
                <div
                  key={user.id}
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_160px_auto] items-center px-5 py-3.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback
                        className={
                          isElevated
                            ? "text-xs font-semibold bg-primary/15 text-primary"
                            : "text-xs font-semibold bg-muted text-muted-foreground"
                        }
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                        {user.name}
                        {isElevated && <Shield className="w-3 h-3 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                        {user.department && (
                          <span className="ml-1 text-muted-foreground/60">· {user.department}</span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <Badge
                          variant="secondary"
                          className={
                            isElevated
                              ? "bg-primary/10 text-primary border-primary/20 text-[11px] font-medium"
                              : "bg-muted text-muted-foreground border-border text-[11px] font-medium"
                          }
                        >
                          {formatRoleLabel(user.role)}
                        </Badge>
                        {user.isActive ? (
                          <Badge variant="outline" className="text-[11px] gap-1">
                            <UserCheck className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[11px] gap-1 text-amber-700">
                            <UserX className="w-3 h-3" />
                            Inactive
                          </Badge>
                        )}
                        {user.mustChangePassword && (
                          <Badge variant="outline" className="text-[11px]">
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
                    currentRole={user.role}
                    currentUserId={currentUser.user.sessionUserId}
                    currentUserRole={currentUser.user.role}
                    isActive={user.isActive}
                    mustChangePassword={user.mustChangePassword}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
