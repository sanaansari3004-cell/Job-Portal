import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { json, error } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { email, password } = body ?? {};

  if (!email || !password) return error("Email and password are required", 400);

  const user = await prisma.user.findUnique({
    where: { email: String(email).trim().toLowerCase() },
    select: { id: true, email: true, name: true, role: true, passwordHash: true },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return error("Invalid email or password", 401);

  const sessionUser = { id: user.id, email: user.email, name: user.name, role: user.role };
  setSessionCookie(sessionUser);
  return json({ user: sessionUser });
}
