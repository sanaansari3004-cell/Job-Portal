import { prisma } from "@/lib/db";
import { requireUser, json, error } from "@/lib/api";
import { NextResponse } from "next/server";
import { JobStatus } from "@prisma/client";

/** GET /api/applications?mine=1 → candidate's own applications with tracker info. */
export async function GET(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const mine = new URL(req.url).searchParams.get("mine") === "1";
  if (user.role === "CANDIDATE" || mine) {
    const applications = await prisma.application.findMany({
      where: { candidateId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            id: true, title: true, company: true, location: true,
            jobType: true, category: true, status: true, salaryMin: true, salaryMax: true,
          },
        },
      },
    });
    return json({ applications });
  }

  // Recruiter: applications across own jobs (optional jobId filter); admin: all.
  const jobId = new URL(req.url).searchParams.get("jobId");
  const where: Record<string, unknown> = {};
  if (user.role === "RECRUITER") where.job = { recruiterId: user.id };
  if (jobId) (where as { jobId?: string }).jobId = jobId;

  const applications = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      job: { select: { id: true, title: true, company: true } },
      candidate: { select: { id: true, name: true, email: true } },
    },
  });
  return json({ applications });
}

/** POST /api/applications → candidate applies to a job. */
export async function POST(req: Request) {
  const user = await requireUser(["CANDIDATE"]);
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  const { jobId, coverNote } = body ?? {};
  if (!jobId) return error("jobId is required", 400);

  const job = await prisma.job.findUnique({ where: { id: String(jobId) } });
  if (!job) return error("Job not found", 404);
  if (job.status !== JobStatus.OPEN) return error("This job is no longer accepting applications", 400);

  const existing = await prisma.application.findUnique({
    where: { jobId_candidateId: { jobId: job.id, candidateId: user.id } },
  });
  if (existing) return error("You have already applied to this job", 409);

  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      candidateId: user.id,
      coverNote: typeof coverNote === "string" ? coverNote.slice(0, 2000) : null,
    },
    include: { job: { select: { title: true, company: true } } },
  });

  return json({ application }, 201);
}
