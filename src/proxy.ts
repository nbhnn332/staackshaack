import { NextResponse, NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = request.cookies.get("stackshack_session")?.value;
  const { pathname } = request.nextUrl;

  let user = null;
  if (session) {
    user = await decrypt(session);
  }

  // Protect Admin pages (excluding the login page itself)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect customer account pages
  if (pathname.startsWith("/account")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (user.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // Redirect authenticated users trying to access login/signup/forgot-password pages
  if (pathname.startsWith("/auth/") || pathname === "/admin/login") {
    if (user) {
      if (user.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/auth/:path*", "/admin/:path*"],
};
