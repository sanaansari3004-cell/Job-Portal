import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "ch_token";

function roleFromToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const segment = token.split(".")[1];
    // base64url → base64 for atob
    const b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE)?.value;
  const role = roleFromToken(token);

  const needsAuth =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (needsAuth && !role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/dashboard/recruiter") && role === "CANDIDATE") {
    return NextResponse.redirect(new URL("/dashboard/candidate", req.url));
  }
  if (pathname.startsWith("/dashboard/candidate") && role === "RECRUITER") {
    return NextResponse.redirect(new URL("/dashboard/recruiter", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
