/**
 * Route protection proxy (Next.js 16 equivalent of middleware.ts).
 * Runs before every request matching the config.matcher below.
 *
 * Protected routes: /dashboard, /requests, /reports, /admin, /profile
 * Public routes: /, /login, /forgot-password, /reset-password
 * Admin-only: /admin/*
 *
 * Uses a minimal NextAuth instance (no providers, no DB calls) so it
 * runs safely in the Edge runtime — reads and verifies the JWT cookie only.
 */
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.department = token.department as string | null;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
        session.user.sessionVersion = Number(token.sessionVersion ?? 0);
      }
      return session;
    },
  },
});

export default auth(
  (req: NextRequest & { auth: { user?: { role?: string; mustChangePassword?: boolean } } | null }) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    const isProtected =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/requests") ||
      pathname.startsWith("/reports") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/profile");

    if (isProtected && !isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (
      isLoggedIn &&
      req.auth?.user?.mustChangePassword &&
      pathname !== "/profile" &&
      !pathname.startsWith("/api")
    ) {
      return NextResponse.redirect(new URL("/profile?forcePasswordChange=1", req.url));
    }

    if (
      (pathname.startsWith("/admin") || pathname.startsWith("/reports")) &&
      req.auth?.user?.role !== "admin" &&
      req.auth?.user?.role !== "superadmin"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|forgot-password|reset-password).*)",
  ],
};
