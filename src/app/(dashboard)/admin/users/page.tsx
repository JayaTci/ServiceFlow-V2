import { redirect } from "next/navigation";
import { getAuthFailureRedirect, getCurrentUserContext } from "@backend/auth/current-user";
import { getAllUsers } from "@backend/features/users/queries";
import { CreateUserDialog } from "@frontend/features/users/components/create-user-dialog";
import { UsersTable } from "@frontend/features/users/components/users-table";

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
          <h2 className="text-xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allUsers.length} account{allUsers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateUserDialog currentUserRole={currentUser.user.role} />
      </div>

      <UsersTable
        users={allUsers}
        currentUserId={currentUser.user.sessionUserId}
        currentUserRole={currentUser.user.role}
      />
    </div>
  );
}
