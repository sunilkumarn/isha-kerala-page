import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protect /admin routes by checking for a Supabase access token cookie.
// This is a lightweight placeholder for a real auth strategy.
export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("sb-access-token")?.value;

  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

