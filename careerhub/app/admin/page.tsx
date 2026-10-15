import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { salaryBand } from "@/lib/format";
import StageBadge from "@/components/StageBadge";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/");

  const [counts, usersByRole, appsByStage, recentJobs, recentApplications] = await Promise.all([
    Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.application.count(),
      prisma.job.count({ where: { status: "OPEN" } }),
    ]),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.application.groupBy({ by: ["stage"], _count: true }),
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { recruiter: { select: { name: true } }, _count: { select: { applications: true } } },
    }),
    prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        job: { select: { title: true, company: true } },
        candidate: { select: { name: true } },
      },
    }),
  ]).catch(() => [[0, 0, 0, 0], [], [], [], []] as const);

  const [users, jobs, applications, openJobs] = counts as [number, number, number, number];

  return (
    <div>
      <p className="kicker mb-2">Press office</p>
      <h1 className="font-display text-4xl font-black tracking-tight">Admin overview</h1>
      <p className="dateline mt-2">The whole gazette at a glance</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { n: users, label: "Registered users" },
          { n: jobs, label: "Total listings" },
          { n: openJobs, label: "Open listings" },
          { n: applications, label: "Applications" },
        ].map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <p className="font-display text-4xl font-black">{s.n.toLocaleString("en-IN")}</p>
            <p className="dateline mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-lg font-black">Users by role</h2>
          <ul className="mt-3 space-y-2">
            {(usersByRole as { role: string; _count: number }[]).map((r) => (
              <li key={r.role} className="flex items-center justify-between border-b border-hairline pb-2 text-sm">
                <span className="font-display font-bold uppercase tracking-wider">{r.role}</span>
                <span className="font-display text-lg font-black">{r._count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-lg font-black">Applications by stage</h2>
          <ul className="mt-3 space-y-2">
            {(appsByStage as { stage: string; _count: number }[]).map((r) => (
              <li key={r.stage} className="flex items-center justify-between border-b border-hairline pb-2 text-sm">
                <StageBadge stage={r.stage} />
                <span className="font-display text-lg font-black">{r._count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="border-b-2 border-ink pb-2 font-display text-2xl font-black">Recent listings</h2>
          <div className="mt-4 space-y-3">
            {(recentJobs as Awaited<ReturnType<typeof prisma.job.findMany>>).map((j) => (
              <div key={j.id} className="card p-4">
                <p className="font-display font-bold">{j.title}</p>
                <p className="text-sm text-ink-soft">
                  {j.company} · by {(j as unknown as { recruiter: { name: string } }).recruiter.name} · {salaryBand(j.salaryMin, j.salaryMax)}
                </p>
                <p className="dateline mt-1">
                  {(j as unknown as { _count: { applications: number } })._count.applications} applications ·{" "}
                  {new Date(j.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="border-b-2 border-ink pb-2 font-display text-2xl font-black">Recent applications</h2>
          <div className="mt-4 space-y-3">
            {(recentApplications as Awaited<ReturnType<typeof prisma.application.findMany>>).map((a) => (
              <div key={a.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-bold">
                      {(a as unknown as { candidate: { name: string } }).candidate.name}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {(a as unknown as { job: { title: string; company: string } }).job.title} @{" "}
                      {(a as unknown as { job: { title: string; company: string } }).job.company}
                    </p>
                    <p className="dateline mt-1">{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                  <StageBadge stage={a.stage} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
