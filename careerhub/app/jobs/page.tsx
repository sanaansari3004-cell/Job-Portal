import Link from "next/link";
import { prisma } from "@/lib/db";
import { salaryBand, JOB_TYPE_LABEL, CATEGORIES } from "@/lib/format";
import { JobType, JobStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const EXPERIENCE_BANDS = ["Fresher", "0-2 years", "2-5 years", "5+ years"];

interface SearchParams {
  q?: string;
  location?: string;
  jobType?: string;
  category?: string;
  experience?: string;
  sort?: string;
  page?: string;
}

function buildUrl(base: SearchParams, overrides: Partial<SearchParams>) {
  const merged = { ...base, ...overrides };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) sp.set(k, v);
  }
  const s = sp.toString();
  return `/jobs${s ? `?${s}` : ""}`;
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const q = searchParams.q?.trim() || "";
  const location = searchParams.location?.trim() || "";
  const jobType = searchParams.jobType || "";
  const category = searchParams.category || "";
  const experience = searchParams.experience || "";
  const sort = searchParams.sort || "newest";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  const where: Record<string, unknown> = { status: JobStatus.OPEN };
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

  let jobs: ({ _count: { applications: number } } & Awaited<ReturnType<typeof prisma.job.findMany>>[number])[] = [];
  let total = 0;
  try {
    [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { _count: { select: { applications: true } } },
      }),
    ]);
  } catch {
    // DB unavailable — render empty state gracefully
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const base = { q, location, jobType, category, experience, sort };

  return (
    <div>
      <p className="kicker mb-2">Classifieds</p>
      <h1 className="font-display text-4xl font-black tracking-tight">Open positions</h1>
      <p className="dateline mt-2">{total.toLocaleString("en-IN")} listing{total === 1 ? "" : "s"} in today&apos;s edition</p>

      {/* Filters */}
      <form method="GET" action="/jobs" className="card mt-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="label" htmlFor="q">Keyword</label>
            <input id="q" name="q" defaultValue={q} placeholder="Title, company, skill…" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input id="location" name="location" defaultValue={location} placeholder="Bengaluru, Remote…" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="jobType">Job type</label>
            <select id="jobType" name="jobType" defaultValue={jobType} className="field">
              <option value="">All types</option>
              {Object.entries({ FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract", INTERNSHIP: "Internship" }).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="category">Desk</label>
            <select id="category" name="category" defaultValue={category} className="field">
              <option value="">All desks</option>
              {(CATEGORIES as readonly string[]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="experience">Experience</label>
            <select id="experience" name="experience" defaultValue={experience} className="field">
              <option value="">Any</option>
              {EXPERIENCE_BANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="label !mb-0" htmlFor="sort">Sort</label>
            <select id="sort" name="sort" defaultValue={sort} className="field !w-auto">
              <option value="newest">Newest first</option>
              <option value="salary">Highest salary</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Link href="/jobs" className="btn-outline !px-4">Reset</Link>
            <button type="submit" className="btn-press !px-4">Search the gazette</button>
          </div>
        </div>
      </form>

      {/* Listings */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {jobs.map((j) => (
          <Link key={j.id} href={`/jobs/${j.id}`} className="card group flex flex-col p-5 hover:border-ink">
            <div className="flex items-start justify-between gap-3">
              <p className="kicker">{j.category}</p>
              <span className="dateline shrink-0">{new Date(j.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </div>
            <h2 className="mt-1 font-display text-xl font-bold leading-snug group-hover:text-oxblood">{j.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{j.company} · {j.location}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="border border-hairline bg-paper-deep px-2 py-0.5 text-xs font-medium">{JOB_TYPE_LABEL[j.jobType]}</span>
              <span className="border border-hairline bg-paper-deep px-2 py-0.5 text-xs font-medium">{j.experience}</span>
              <span className="border border-hairline bg-paper-deep px-2 py-0.5 text-xs font-medium">{j._count.applications} applied</span>
            </div>
            <p className="mt-3 font-display text-base font-bold">{salaryBand(j.salaryMin, j.salaryMax)}</p>
          </Link>
        ))}
      </div>
      {jobs.length === 0 && (
        <div className="card mt-6 p-10 text-center">
          <p className="font-display text-xl font-bold">No listings match this search.</p>
          <p className="mt-2 text-ink-soft">Try broadening the keyword or clearing a filter.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Link href={buildUrl(base, { page: String(page - 1) })} className="btn-outline !px-4 !py-2">← Prev</Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-2">
                {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-ink-faint">…</span>}
                <Link
                  href={buildUrl(base, { page: String(p) })}
                  className={`border px-3 py-2 font-display text-sm font-bold ${p === page ? "border-ink bg-ink text-paper" : "border-hairline hover:border-ink"}`}
                >
                  {p}
                </Link>
              </span>
            ))}
          {page < totalPages && (
            <Link href={buildUrl(base, { page: String(page + 1) })} className="btn-outline !px-4 !py-2">Next →</Link>
          )}
        </nav>
      )}
    </div>
  );
}
