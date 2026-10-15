import { prisma } from "@/lib/db";
import { requireUser, json, error } from "@/lib/api";
import { NextResponse } from "next/server";
import { JobType, JobStatus } from "@prisma/client";

const PAGE_SIZE = 12;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const location = url.searchParams.get("location")?.trim() || "";
  const jobType = url.searchParams.get("jobType")?.trim() || "";
  const category = url.searchParams.get("category")?.trim() || "";
  const experience = url.searchParams.get("experience")?.trim() || "";
  const sort = url.searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const includeClosed = url.searchParams.get("includeClosed") === "1";

  const where: Record<string, unknown> = {};
  if (!includeClosed) where.status = JobStatus.OPEN;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (location) where.location = { contains: location, mode: "insensitive" };
  if (jobType && jobType in JobType) where.jobType = jobType as JobType;
  if (category) where.category = category;
  if (experience) where.experience = { contains: experience, mode: "insensitive" };

  const orderBy =
    sort === "salary"
      ? [{ salaryMax: "desc" as const }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        recruiter: { select: { name: true } },
        _count: { select: { applications: true } },
      },
    }),
  ]);

  return NextResponse.json({
    jobs,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

export async function POST(req: Request) {
  const user = await requireUser(["RECRUITER", "ADMIN"]);
  if (user instanceof NextResponse) return user;

  const body = await req.json().catch(() => null);
  const { title, company, location, jobType, category, experience, salaryMin, salaryMax, description, requirements } = body ?? {};

  if (!title || !company || !location || !category || !description)
    return error("Title, company, location, category and description are required", 400);
  if (jobType && !(jobType in JobType)) return error("Invalid job type", 400);

  const toInt = (v: unknown) => {
    const n = parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const job = await prisma.job.create({
    data: {
      title: String(title).trim(),
      company: String(company).trim(),
      location: String(location).trim(),
      jobType: (jobType as JobType) || JobType.FULL_TIME,
      category: String(category).trim(),
      experience: String(experience || "Not specified").trim(),
      salaryMin: toInt(salaryMin),
      salaryMax: toInt(salaryMax),
      description: String(description),
      requirements: String(requirements || ""),
      recruiterId: user.id,
    },
  });

  return json({ job }, 201);
}
