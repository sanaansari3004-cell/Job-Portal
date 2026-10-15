import { prisma } from "@/lib/db";
import { requireUser, json } from "@/lib/api";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await requireUser(["ADMIN"]);
  if (user instanceof NextResponse) return user;

  const [users, jobs, applications, openJobs] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.job.count({ where: { status: "OPEN" } }),
  ]);

  const usersByRole = await prisma.user.groupBy({ by: ["role"], _count: true });
  const appsByStage = await prisma.application.groupBy({ by: ["stage"], _count: true });

  const recentJobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { recruiter: { select: { name: true } }, _count: { select: { applications: true } } },
  });

  const recentApplications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      job: { select: { title: true, company: true } },
      candidate: { select: { name: true, email: true } },
    },
  });

  return json({
    counts: { users, jobs, applications, openJobs },
    usersByRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count])),
    appsByStage: Object.fromEntries(appsByStage.map((r) => [r.stage, r._count])),
    recentJobs,
    recentApplications,
  });
}
