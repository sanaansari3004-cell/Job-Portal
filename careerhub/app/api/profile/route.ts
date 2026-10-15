import { prisma } from "@/lib/db";
import { requireUser, json } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  let profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    profile = await prisma.profile.create({ data: { userId: user.id } });
  }
  return json({ profile, user: { name: user.name, email: user.email } });
}

export async function PATCH(req: Request) {
  const user = await requireUser(["CANDIDATE"]);
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null) ?? {};
  const data: Record<string, unknown> = {};
  if (typeof body.headline === "string") data.headline = body.headline.slice(0, 140);
  if (typeof body.location === "string") data.location = body.location.slice(0, 80);
  if (Array.isArray(body.skills)) {
    data.skills = body.skills
      .filter((s: unknown) => typeof s === "string" && s.trim())
      .slice(0, 30)
      .map((s: string) => s.trim());
  }
  if (typeof body.experience === "string") data.experience = body.experience.slice(0, 4000);
  if (typeof body.education === "string") data.education = body.education.slice(0, 4000);

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...(data as Record<string, never>) },
    update: data,
  });

  if (typeof body.name === "string" && body.name.trim()) {
    await prisma.user.update({ where: { id: user.id }, data: { name: body.name.trim().slice(0, 80) } });
  }

  return json({ profile });
}
