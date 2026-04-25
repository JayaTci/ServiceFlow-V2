import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAllUsers } from "@/lib/queries/users";
import { UserActions } from "@/components/admin/user-actions";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { formatDate } from "@/lib/utils";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const users = await getAllUsers();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} account{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_160px_auto] items-center px-5 py-2.5 bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          <span>User</span>
          <span className="hidden sm:block">Role</span>
          <span className="hidden sm:block">Joined</span>
          <span />
        </div>

        {/* User rows */}
        {users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">No users yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {users.map((user) => {
              const initials = user.name
                .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              const isAdmin = user.role === "admin";

              return (
                <div
                  key={user.id}
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_160px_auto] items-center px-5 py-3.5 hover:bg-muted/20 transition-colors"
                >
                  {/* User identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback
                        className={
                          isAdmin
                            ? "text-xs font-semibold bg-primary/15 text-primary"
                            : "text-xs font-semibold bg-muted text-muted-foreground"
                        }
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                        {user.name}
                        {isAdmin && (
                          <Shield className="w-3 h-3 text-primary shrink-0" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                        {user.department && (
                          <span className="ml-1 text-muted-foreground/60">· {user.department}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Role badge */}
                  <div className="hidden sm:block">
                    <Badge
                      variant="secondary"
                      className={
                        isAdmin
                          ? "bg-primary/10 text-primary border-primary/20 text-[11px] font-medium"
                          : "bg-muted text-muted-foreground border-border text-[11px] font-medium"
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>

                  {/* Joined date */}
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</p>
                  </div>

                  {/* Actions */}
                  <UserActions
                    userId={user.id}
                    currentRole={user.role}
                    currentUserId={session.user.id}
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
