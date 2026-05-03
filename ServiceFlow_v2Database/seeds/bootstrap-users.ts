import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

/** Upserts the three bootstrap accounts without touching existing request data. */
async function bootstrapUsers() {
  console.log("🔐 Bootstrapping user accounts...");

  const superadminHash = await bcrypt.hash("local@dm1n123", 10);
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("user123", 10);
  const bootstrapAccounts = [
    {
      name: "System Superadmin",
      email: "admin@serviceflow.com",
      passwordHash: superadminHash,
      role: "superadmin" as const,
      department: "IT",
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "Maria Santos",
      email: "maria@serviceflow.com",
      passwordHash: adminHash,
      role: "admin" as const,
      department: "Finance",
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: "John Dela Cruz",
      email: "john@serviceflow.com",
      passwordHash: userHash,
      role: "user" as const,
      department: "HR",
      isActive: true,
      mustChangePassword: false,
    },
  ];

  for (const account of bootstrapAccounts) {
    await db
      .insert(schema.users)
      .values(account)
      .onConflictDoUpdate({
        target: schema.users.email,
        set: {
          name: account.name,
          passwordHash: account.passwordHash,
          role: account.role,
          department: account.department,
          isActive: account.isActive,
          mustChangePassword: account.mustChangePassword,
          updatedAt: new Date(),
        },
      });
  }

  console.log("✅ Bootstrap accounts ready:");
  console.log("  Superadmin: admin@serviceflow.com / local@dm1n123");
  console.log("  Admin: maria@serviceflow.com / admin123");
  console.log("  User: john@serviceflow.com / user123");

  await pool.end();
}

bootstrapUsers().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
