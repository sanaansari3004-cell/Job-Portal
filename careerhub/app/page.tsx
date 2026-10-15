import Link from "next/link";
import { prisma } from "@/lib/db";
import { salaryBand, JOB_TYPE_LABEL, CATEGORIES } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getStats() {
  try {
    const [jobs, candidates, recruiters] = await Promise.all([
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.user.count({ where: { role: "CANDIDATE" } }),
      prisma.user.count({ where: { role: "RECRUITER" } }),
    ]);
    const latest = await prisma.job.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, company: true, location: true, jobType: true, salaryMin: true, salaryMax: true, category: true },
    });
    const byCategory = await prisma.job.groupBy({
      by: ["category"],
      where: { status: "OPEN" },
      _count: true,
    });
    return { jobs, candidates, recruiters, latest, byCategory };
  } catch {
    return { jobs: 0, candidates: 0, recruiters: 0, latest: [], byCategory: [] as { category: string; _count: number }[] };
  }
}

export default async function Home() {
  const stats = await getStats();

  return (
    <div>
      {/* Front page headline */}
      <section className="pb-8">
        <p className="kicker mb-3">The morning edition · Careers</p>
        <h1 className="font-display text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl">
          Every job worth having,
          <br />
          <span className="text-oxblood">set in honest type.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          CareerHub is a job portal run like a newsroom: candidates file their profiles,
          recruiters publish openings, and every application moves through a visible
          pipeline — applied, shortlisted, interview, hired.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/jobs" className="btn-press">Browse open roles</Link>
          <Link href="/register" className="btn-outline">File your profile</Link>
        </div>
      </section>

      {/* Figures of the day */}
      <section className="rule-double pt-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { n: stats.jobs, label: "Open positions" },
            { n: stats.candidates, label: "Candidates on file" },
            { n: stats.recruiters, label: "Recruiting desks" },
          ].map((s) => (
            <div key={s.label} className="card p-5 text-center">
              <p className="font-display text-4xl font-black">{s.n.toLocaleString("en-IN")}</p>
              <p className="dateline mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Desks / categories */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between border-b-2 border-ink pb-2">
          <h2 className="font-display text-2xl font-black">Desks</h2>
          <Link href="/jobs" className="font-display text-xs font-bold uppercase tracking-[0.14em] text-oxblood hover:underline">
            All listings →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {(CATEGORIES as readonly string[]).map((cat) => {
            const count = stats.byCategory.find((c) => c.category === cat)?._count ?? 0;
            return (
              <Link key={cat} href={`/jobs?category=${encodeURIComponent(cat)}`} className="card group p-5 hover:border-ink">
                <p className="font-display text-lg font-bold group-hover:text-oxblood">{cat}</p>
                <p className="dateline mt-2">{count} open</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Latest listings */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between border-b-2 border-ink pb-2">
          <h2 className="font-display text-2xl font-black">Latest listings</h2>
          <Link href="/jobs" className="font-display text-xs font-bold uppercase tracking-[0.14em] text-oxblood hover:underline">
            Full classifieds →
          </Link>
        </div>
        <div className="divide-y divide-hairline border-y border-hairline">
          {stats.latest.length === 0 && (
            <p className="py-8 text-center text-ink-faint">
              No listings yet — run the seed script to fill the classifieds.
            </p>
          )}
          {stats.latest.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`} className="group flex items-center justify-between gap-4 bg-paper-card px-4 py-4 transition-colors hover:bg-paper-deep">
              <div className="min-w-0">
                <p className="kicker">{j.category}</p>
                <p className="truncate font-display text-lg font-bold group-hover:text-oxblood">{j.title}</p>
                <p className="text-sm text-ink-soft">
                  {j.company} · {j.location} · {JOB_TYPE_LABEL[j.jobType]}
                </p>
              </div>
              <p className="shrink-0 font-display text-sm font-bold">{salaryBand(j.salaryMin, j.salaryMax)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
