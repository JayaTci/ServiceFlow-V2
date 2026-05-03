import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/schema";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

/** Seeds local demo users, requests, comments, and activity data. */
async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(schema.serviceRequests);
  await db.delete(schema.users);

  // Seed users
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("user123", 10);

  const [admin, user1, user2] = await db
    .insert(schema.users)
    .values([
      {
        name: "Admin User",
        email: "admin@serviceflow.com",
        passwordHash: adminHash,
        role: "admin",
        department: "IT",
      },
      {
        name: "John Dela Cruz",
        email: "john@serviceflow.com",
        passwordHash: userHash,
        role: "user",
        department: "HR",
      },
      {
        name: "Maria Santos",
        email: "maria@serviceflow.com",
        passwordHash: userHash,
        role: "user",
        department: "Finance",
      },
    ])
    .returning();

  console.log(`✅ Created ${3} users`);

  // Seed service requests
  const sampleRequests = [
    {
      title: "Laptop won't connect to VPN",
      description:
        "My laptop cannot connect to the company VPN since yesterday morning.",
      requestType: "it_support" as schema.RequestType,
      department: "HR",
      requestedById: user1.id,
      dateRequested: "2026-03-15",
      priority: "high" as schema.Priority,
      status: "in_progress" as schema.Status,
    },
    {
      title: "Office printer jam on 3rd floor",
      description:
        "The printer near the conference room has a persistent paper jam.",
      requestType: "maintenance" as schema.RequestType,
      department: "Finance",
      requestedById: user2.id,
      dateRequested: "2026-03-18",
      priority: "medium" as schema.Priority,
      status: "resolved" as schema.Status,
    },
    {
      title: "Request for new ergonomic chair",
      description:
        "Need an ergonomic chair replacement due to back issues caused by the current chair.",
      requestType: "office" as schema.RequestType,
      department: "HR",
      requestedById: user1.id,
      dateRequested: "2026-03-20",
      priority: "low" as schema.Priority,
      status: "pending" as schema.Status,
    },
    {
      title: "COE document processing",
      description:
        "Requesting Certificate of Employment for bank loan application.",
      requestType: "document_processing" as schema.RequestType,
      department: "HR",
      requestedById: user1.id,
      dateRequested: "2026-03-22",
      priority: "high" as schema.Priority,
      status: "resolved" as schema.Status,
    },
    {
      title: "Email account not working",
      description:
        "Cannot send emails from my Outlook account. Getting authentication error.",
      requestType: "it_support" as schema.RequestType,
      department: "Finance",
      requestedById: user2.id,
      dateRequested: "2026-03-25",
      priority: "urgent" as schema.Priority,
      status: "in_progress" as schema.Status,
    },
    {
      title: "Air conditioning unit not cooling",
      description: "The AC unit in the server room is not cooling adequately.",
      requestType: "maintenance" as schema.RequestType,
      department: "IT",
      requestedById: admin.id,
      dateRequested: "2026-03-28",
      priority: "urgent" as schema.Priority,
      status: "in_progress" as schema.Status,
    },
    {
      title: "Software license renewal",
      description:
        "Adobe Creative Suite license expiring next month. Need renewal.",
      requestType: "it_support" as schema.RequestType,
      department: "Marketing",
      requestedById: admin.id,
      dateRequested: "2026-04-01",
      priority: "medium" as schema.Priority,
      status: "pending" as schema.Status,
    },
    {
      title: "Conference room projector broken",
      description: "The projector in Conference Room A is not displaying.",
      requestType: "maintenance" as schema.RequestType,
      department: "Admin",
      requestedById: admin.id,
      dateRequested: "2026-04-02",
      priority: "high" as schema.Priority,
      status: "pending" as schema.Status,
    },
    {
      title: "Internet connection slow",
      description: "Internet speed dropped significantly affecting video calls.",
      requestType: "it_support" as schema.RequestType,
      department: "Operations",
      requestedById: user2.id,
      dateRequested: "2026-04-03",
      priority: "high" as schema.Priority,
      status: "pending" as schema.Status,
    },
    {
      title: "Office supplies restocking",
      description: "Need to restock printer paper, pens, and folders.",
      requestType: "office" as schema.RequestType,
      department: "Admin",
      requestedById: admin.id,
      dateRequested: "2026-04-03",
      priority: "low" as schema.Priority,
      status: "closed" as schema.Status,
    },
    {
      title: "Update employee handbook",
      description:
        "The employee handbook needs to be updated with new WFH policies.",
      requestType: "document_processing" as schema.RequestType,
      department: "HR",
      requestedById: user1.id,
      dateRequested: "2026-04-04",
      priority: "medium" as schema.Priority,
      status: "pending" as schema.Status,
    },
    {
      title: "Network switch replacement",
      description: "The network switch on floor 2 is overheating and failing.",
      requestType: "it_support" as schema.RequestType,
      department: "IT",
      requestedById: admin.id,
      dateRequested: "2026-04-05",
      priority: "urgent" as schema.Priority,
      status: "in_progress" as schema.Status,
    },
    {
      title: "Fire extinguisher inspection",
      description: "Annual fire extinguisher inspection due.",
      requestType: "maintenance" as schema.RequestType,
      department: "Admin",
      requestedById: admin.id,
      dateRequested: "2026-04-06",
      priority: "medium" as schema.Priority,
      status: "cancelled" as schema.Status,
    },
    {
      title: "New employee onboarding setup",
      description: "Setup laptop, accounts, and access for new hire starting Monday.",
      requestType: "general" as schema.RequestType,
      department: "IT",
      requestedById: user1.id,
      dateRequested: "2026-04-07",
      priority: "high" as schema.Priority,
      status: "pending" as schema.Status,
    },
    {
      title: "Expense report template update",
      description: "The expense report template needs to include new tax fields.",
      requestType: "document_processing" as schema.RequestType,
      department: "Finance",
      requestedById: user2.id,
      dateRequested: "2026-04-08",
      priority: "low" as schema.Priority,
      status: "pending" as schema.Status,
    },
  ];

  const requestsToInsert = sampleRequests.map((req, i) => ({
    ...req,
    requestCode: `SR-2026-${String(i + 1).padStart(4, "0")}`,
  }));

  await db.insert(schema.serviceRequests).values(requestsToInsert);

  console.log(`✅ Created ${requestsToInsert.length} service requests`);
  console.log("\n📋 Login credentials:");
  console.log("  Admin: admin@serviceflow.com / local@dm1n");
  console.log("  User1: john@serviceflow.com / user123");
  console.log("  User2: maria@serviceflow.com / admin123");
  console.log("\n✅ Seeding complete!");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
