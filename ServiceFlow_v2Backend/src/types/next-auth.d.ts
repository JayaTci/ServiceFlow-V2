/**
 * Module augmentation for Auth.js v5 session and JWT types.
 * Adds role and department fields so we can access them without type casts.
 */
import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      department: string | null;
      mustChangePassword: boolean;
      sessionVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: string;
    department?: string | null;
    mustChangePassword?: boolean;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    department: string | null;
    mustChangePassword: boolean;
    sessionVersion: number;
  }
}
