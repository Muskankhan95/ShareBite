import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";
import { rateLimit } from "@/lib/security/rate-limit";
import { MonitoringLogger } from "@/lib/monitoring/logger";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // 1. Rate Limiting for Authentication Endpoints (Brute-force protection)
  if (pathname === "/api/auth/login" || pathname === "/api/auth/register") {
    const rl = rateLimit(req, { limit: 20, windowMs: 60000, keyPrefix: "auth_rl" });
    if (!rl.success) {
      MonitoringLogger.logAuthFailure("RateLimit", `IP ${ip} exceeded auth attempt threshold`, ip);
      return NextResponse.json(
        { error: "Too many authentication attempts. Please try again after 60 seconds." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  const token = req.cookies.get("auth_token")?.value;
  const user = token ? await verifyJWT(token) : null;

  // Determine if path is a protected role route or admin API
  const isAdminApi = pathname.startsWith("/api/admin");
  const isDonorRoute = pathname.startsWith("/donor");
  const isNgoRoute = pathname.startsWith("/ngo");
  const isVolunteerRoute = pathname.startsWith("/volunteer");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedRoute = isDonorRoute || isNgoRoute || isVolunteerRoute || isAdminRoute;
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  // 2. Protect Admin APIs
  if (isAdminApi) {
    if (!user) {
      MonitoringLogger.logAuthFailure("Unknown", `Unauthorized attempt on admin API: ${pathname}`, ip);
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (user.role !== "admin") {
      MonitoringLogger.logAuthFailure(user.email, `Forbidden non-admin access attempt on: ${pathname}`, ip);
      return NextResponse.json({ error: "Access Denied: Admin authorization required." }, { status: 403 });
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // 3. Unauthenticated user trying to access a protected dashboard
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // 4. Authenticated user trying to access another role's protected area
  if (user && isProtectedRoute) {
    const userRole = user.role;
    const isAuthorized =
      (userRole === "donor" && isDonorRoute) ||
      (userRole === "ngo" && isNgoRoute) ||
      (userRole === "volunteer" && isVolunteerRoute) ||
      (userRole === "admin" && isAdminRoute);

    if (!isAuthorized) {
      const dashboardUrl = new URL(`/${userRole}/dashboard`, req.url);
      return withSecurityHeaders(NextResponse.redirect(dashboardUrl));
    }
  }

  // 5. Authenticated user visiting /login or /register -> send to their role dashboard
  if (user && isAuthRoute) {
    const dashboardUrl = new URL(`/${user.role}/dashboard`, req.url);
    return withSecurityHeaders(NextResponse.redirect(dashboardUrl));
  }

  return withSecurityHeaders(NextResponse.next());
}

/**
 * Attaches production HTTP security headers
 */
function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  res.headers.set("X-XSS-Protection", "1; mode=block");

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: data:",
    "frame-ancestors 'none'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [
    "/donor/:path*",
    "/ngo/:path*",
    "/volunteer/:path*",
    "/admin/:path*",
    "/api/:path*",
    "/login",
    "/register",
  ],
};
