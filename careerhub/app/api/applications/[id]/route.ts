import { prisma } from "@/lib/db";
import { requireUser, json, error } from "@/lib/api";
import { NextResponse } from "next/server";
import { Stage } from "@prisma/client";

/** Recruiter (job owner) or admin: view a full application incl. candidate profile. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(["RECRUITER", "ADMIN"]);
  if (user instanceof NextResponse) return user;

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      job: true,
      candidate: { select: { id: true, email: true, name: true, role: true, createdAt: true, profile: true } },
    },
  });
  if (!application) return error("Application not found", 404);
  if (user.role !== "ADMIN" && application.job.recruiterId !== user.id) return error("Forbidden", 403);

  return json({ application });
}

/** Move pipeline stage or save recruiter notes. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(["RECRUITER", "ADMIN"]);
  if (user instanceof NextResponse) return user;

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: { job: true },
  });
  if (!application) return error("Application not found", 404);
  if (user.role !== "ADMIN" && application.job.recruiterId !== user.id) return error("Forbidden", 403);

  const body = await req.json().catch(() => null) ?? {};
  const data: Record<string, unknown> = {};
  if (typeof body.stage === "string" && body.stage in Stage) data.stage = body.stage as Stage;
  if (typeof body.notes === "string") data.notes = body.notes.slice(0, 4000);
  if (Object.keys(data).length === 0) return error("Nothing to update", 400);

  const updated = await prisma.application.update({ where: { id: params.id }, data });
  return json({ application: updated });
}
