import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { json, error } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { name, email, password, role } = body ?? {};

  if (!name || !email || !password) return error("Name, email and password are required", 400);
  if (typeof password !== "string" || password.length < 8)
    return error("Password must be at least 8 characters", 400);

  const roleValue = role === "RECRUITER" ? "RECRUITER" : "CANDIDATE";
  const emailNorm = String(email).trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) return error("An account with this email already exists", 409);

  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: emailNorm,
      passwordHash: await hashPassword(password),
      role: roleValue,
      profile: roleValue === "CANDIDATE" ? { create: {} } : undefined,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  setSessionCookie(user);
  return json({ user });
}
