import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./ServiceFlow_v2Database/src/schema.ts",
  out: "./ServiceFlow_v2Database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
