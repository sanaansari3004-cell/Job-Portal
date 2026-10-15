import { NextResponse } from "next/server";
import { getSession, SessionUser, Role } from "./auth";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Returns the session or an error response if missing / role not allowed. */
export async function requireUser(roles?: Role[]): Promise<SessionUser | NextResponse> {
  const session = await getSession();
  if (!session) return error("Not signed in", 401);
  if (roles && !roles.includes(session.role)) return error("Forbidden", 403);
  return session;
}
