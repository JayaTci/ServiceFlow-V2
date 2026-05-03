import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { db } from "@database/client";
import { users } from "@database/schema";
import { loginSchema } from "@shared/validation/auth";

function applyTokenUserFields(
  token: JWT,
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    department?: string | null;
    mustChangePassword?: boolean;
    sessionVersion?: number;
  }
) {
  if (!user.id) {
    throw new Error("User ID missing from auth token — credentials flow is broken");
  }

  token.id = user.id;
  token.name = user.name ?? token.name ?? null;
  token.email = user.email ?? token.email ?? null;
  token.role = user.role ?? "user";
  token.department = user.department ?? null;
  token.mustChangePassword = user.mustChangePassword ?? false;
  token.sessionVersion = user.sessionVersion ?? 0;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const { password } = parsed.data;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user || !user.isActive) return null;

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          mustChangePassword: user.mustChangePassword,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        applyTokenUserFields(token, user);
      }

      if (trigger === "update" && session) {
        token.name = session.name ?? token.name ?? null;
        token.department =
          typeof session.department !== "undefined" ? session.department : token.department;
        token.mustChangePassword =
          typeof session.mustChangePassword === "boolean"
            ? session.mustChangePassword
            : token.mustChangePassword;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.department = token.department;
      session.user.mustChangePassword = token.mustChangePassword;
      session.user.sessionVersion = token.sessionVersion;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});
