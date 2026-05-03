import { eq } from "drizzle-orm";
import { db } from "@database/client";
import { users } from "@database/schema";
import type { User } from "@database/schema";

type SafeUser = Pick<
  User,
  | "id"
  | "name"
  | "email"
  | "role"
  | "department"
  | "isActive"
  | "mustChangePassword"
  | "createdAt"
  | "updatedAt"
>;

export async function getAllUsers(): Promise<SafeUser[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      department: users.department,
      isActive: users.isActive,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(users.createdAt);
}

export async function getUserById(id: number): Promise<SafeUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      department: users.department,
      isActive: users.isActive,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user ?? null;
}
