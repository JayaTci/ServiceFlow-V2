import { db } from "@database/client";
import { users } from "@database/schema";
import { eq } from "drizzle-orm";
import type { User } from "@database/schema";

type SafeUser = Pick<User, "id" | "name" | "email" | "role" | "department" | "createdAt" | "updatedAt">;

export async function getAllUsers(): Promise<SafeUser[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      department: users.department,
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
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user ?? null;
}
