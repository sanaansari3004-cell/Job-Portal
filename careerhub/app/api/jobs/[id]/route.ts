import { prisma } from "@/lib/db";
import { requireUser, json, error } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { JobType, JobStatus } from "@prisma/client";

async function findJob(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      recruiter: { select: { name: true, email: true } },
      _count: { select: { applications: true } },
    },
  });
}

function canManage(sessionRole: string, sessionId: string, jobRecruiterId: string) {
  return sessionRole === "ADMIN" || jobRecruiterId === sessionId;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const job = await findJob(params.id);
  if (!job) return error("Job not found", 404);
  if (job.status === JobStatus.CLOSED) {
    // Candidates see closed jobs only via their own applications; recruiters see their own.
    const session = await getSession();
    const mine = session && (session.role === "ADMIN" || (session.role === "RECRUITER" && job.recruiterId === session.id));
    if (!mine) {
      const applied = session
        ? await prisma.application.findUnique({
            where: { jobId_candidateId: { jobId: job.id, candidateId: session.id } },
          })
        : null;
      if (!applied) return error("Job not found", 404);
    }
  }
  return json({ job });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(["RECRUITER", "ADMIN"]);
  if (user instanceof NextResponse) return user;

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return error("Job not found", 404);
  if (!canManage(user.role, user.id, job.recruiterId)) return error("Forbidden", 403);

  const body = await req.json().catch(() => null) ?? {};
  const data: Record<string, unknown> = {};
  for (const key of ["title", "company", "location", "category", "experience", "description", "requirements"] as const) {
    if (typeof body[key] === "string") data[key] = body[key].trim();
  }
  if (body.jobType && body.jobType in JobType) data.jobType = body.jobType;
  if (body.status && body.status in JobStatus) data.status = body.status;
  const toInt = (v: unknown) => {
    if (v === null || v === "") return null;
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  if ("salaryMin" in body) data.salaryMin = toInt(body.salaryMin);
  if ("salaryMax" in body) data.salaryMax = toInt(body.salaryMax);

  const updated = await prisma.job.update({ where: { id: params.id }, data });
  return json({ job: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(["RECRUITER", "ADMIN"]);
  if (user instanceof NextResponse) return user;

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) return error("Job not found", 404);
  if (!canManage(user.role, user.id, job.recruiterId)) return error("Forbidden", 403);

  await prisma.job.delete({ where: { id: params.id } });
  return json({ ok: true });
}
