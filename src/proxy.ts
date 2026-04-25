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
      }
      return session;
    },
  },
});

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/requests") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile");

  // Unauthenticated → login
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logged-in user visiting login → dashboard
  if (isLoggedIn && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Non-admin visiting admin routes → dashboard
  if (pathname.startsWith("/admin") && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match everything EXCEPT:
     * - /api/* (NextAuth API routes)
     * - /_next/* (Next.js internals)
     * - Static files
     * - /forgot-password, /reset-password (public auth flows)
     * - /login (handled inline above)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|forgot-password|reset-password).*)",
  ],
};
