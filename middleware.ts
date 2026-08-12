// middleware.ts - with single-device session enforcement
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/complete-profile",
  "/api/login",
  "/api/users/complete-profile",
  "/api/users/profile-check",
  "/api/logout",
  "/api/session",
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicPath = PUBLIC_PATHS.some((p) => path.startsWith(p));

  const userId = request.cookies.get("session_token")?.value;
  const sessionKey = request.cookies.get("session_key")?.value;

  // 1. Auth check — no user id → redirect to sign-in
  if (!isPublicPath && !userId) {
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Single-device session check
  // Only run on dashboard/settings routes (not API, not public)
  if (userId && sessionKey && !isPublicPath && !path.startsWith("/api/")) {
    try {
      // Check if security system is enabled
      const flagUrl = new URL("/api/security-flag", request.url);
      const flagRes = await fetch(flagUrl);
      const { enabled: securityEnabled } = flagRes.ok ? await flagRes.json() : { enabled: false };

      if (securityEnabled) {
        const checkUrl = new URL("/api/session/validate", request.url);
        const res = await fetch(checkUrl, {
          headers: {
            Cookie: `session_token=${userId}; session_key=${sessionKey}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (!data.valid) {
            // Session was invalidated (another device logged in)
            const response = NextResponse.redirect(new URL("/sign-in?reason=session_expired", request.url));
            response.cookies.delete("session_token");
            response.cookies.delete("session_key");
            return response;
          }
        }
      }
    } catch {
      // If check fails, allow through (don't block on network errors)
    }
  }

  // Logged-in users on auth pages -> dashboard
  if (userId && (path.startsWith("/sign-in") || path.startsWith("/sign-up"))) {
    try {
      const apiUrl = new URL("/api/users/profile-check", request.url);
      const profileResponse = await fetch(apiUrl, {
        headers: { Cookie: `session_token=${userId}` },
      });
      if (profileResponse.status === 401 || profileResponse.status === 404) {
        const response = NextResponse.next();
        response.cookies.delete("session_token");
        response.cookies.delete("session_key");
        return response;
      }
    } catch {
      // Network error, just proceed to redirect
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Profile completion check
  if (userId && !isPublicPath) {
    try {
      const apiUrl = new URL("/api/users/profile-check", request.url);
      const profileResponse = await fetch(apiUrl, {
        headers: { Cookie: `session_token=${userId}` },
      });

      if (profileResponse.status === 401 || profileResponse.status === 404) {
        const response = NextResponse.redirect(new URL("/sign-in", request.url));
        response.cookies.delete("session_token");
        response.cookies.delete("session_key");
        return response;
      }

      const contentType = profileResponse.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await profileResponse.json();

        if (!data.profile_completed && !path.startsWith("/complete-profile")) {
          const redirectUrl = new URL("/complete-profile", request.url);
          redirectUrl.searchParams.set("redirect", path);
          return NextResponse.redirect(redirectUrl);
        }

        if (data.profile_completed && path.startsWith("/complete-profile")) {
          const redirectTo = request.nextUrl.searchParams.get("redirect") || "/dashboard";
          return NextResponse.redirect(new URL(redirectTo, request.url));
        }
      }
    } catch {
      // continue
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/complete-profile/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
