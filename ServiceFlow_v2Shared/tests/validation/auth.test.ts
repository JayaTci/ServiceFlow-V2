import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@shared/validation/auth";

describe("auth validation", () => {
  it("normalizes login emails", () => {
    const result = loginSchema.parse({
      email: " User@Example.COM ",
      password: "password123",
    });

    expect(result.email).toBe("user@example.com");
  });

  it("rejects invalid registration departments", () => {
    const result = registerSchema.safeParse({
      name: "Jane User",
      email: "jane@example.com",
      password: "password123",
      department: "Engineering",
    });

    expect(result.success).toBe(false);
  });

  it("caps password length", () => {
    const result = loginSchema.safeParse({
      email: "jane@example.com",
      password: "x".repeat(101),
    });

    expect(result.success).toBe(false);
  });
});
