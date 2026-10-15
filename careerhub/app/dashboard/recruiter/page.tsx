import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { salaryBand, JOB_TYPE_LABEL } from "@/lib/format";
import StageBadge from "@/components/StageBadge";
import CloseJobButton from "@/components/CloseJobButton";

export const dynamic = "force-dynamic";

export default async function RecruiterDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/recruiter");

  const [jobs, recentApps] = await Promise.all([
    prisma.job
      .findMany({
        where: { recruiterId: session.id },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { applications: true } } },
      })
      .catch(() => []),
    prisma.application
      .findMany({
        where: { job: { recruiterId: session.id } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          job: { select: { id: true, title: true } },
          candidate: { select: { name: true } },
        },
      })
      .catch(() => []),
  ]);

  const openJobs = jobs.filter((j) => j.status === "OPEN").length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="kicker mb-2">Recruiting desk</p>
          <h1 className="font-display text-4xl font-black tracking-tight">Newsroom</h1>
          <p className="dateline mt-2">Your listings, your pipeline, your correspondents</p>
        </div>
        <Link href="/dashboard/recruiter/jobs/new" className="btn-press">+ Publish a job</Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { n: jobs.length, label: "Listings published" },
          { n: openJobs, label: "Currently open" },
          { n: jobs.reduce((s, j) => s + j._count.applications, 0), label: "Applications received" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="font-display text-3xl font-black">{s.n}</p>
            <p className="dateline mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Jobs */}
        <section className="lg:col-span-2">
          <h2 className="border-b-2 border-ink pb-2 font-display text-2xl font-black">Your listings</h2>
          <div className="mt-4 space-y-3">
            {jobs.length === 0 && (
              <div className="card p-8 text-center">
                <p className="font-display text-lg font-bold">No listings yet.</p>
                <p className="mt-1 text-sm text-ink-soft">Publish your first opening to start receiving applications.</p>
              </div>
            )}
            {jobs.map((j) => (
              <div key={j.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${j.status === "OPEN" ? "bg-green-700" : "bg-ink-faint"}`} />
                      <span className="dateline">{j.status === "OPEN" ? "Open" : "Closed"}</span>
                    </p>
                    <Link href={`/dashboard/recruiter/jobs/${j.id}/pipeline`} className="font-display text-lg font-bold hover:text-oxblood">
                      {j.title}
                    </Link>
                    <p className="text-sm text-ink-soft">
                      {j.company} · {j.location} · {JOB_TYPE_LABEL[j.jobType]} · {salaryBand(j.salaryMin, j.salaryMax)}
                    </p>
                    <p className="dateline mt-1">{j._count.applications} application{j._count.applications === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/recruiter/jobs/${j.id}/pipeline`} className="btn-outline !px-3 !py-1.5 !text-[11px]">Pipeline</Link>
                    <Link href={`/dashboard/recruiter/jobs/${j.id}/edit`} className="btn-outline !px-3 !py-1.5 !text-[11px]">Edit</Link>
                    {j.status === "OPEN" ? (
                      <CloseJobButton jobId={j.id} />
                    ) : (
                      <Link href={`/dashboard/recruiter/jobs/${j.id}/edit`} className="btn-outline !px-3 !py-1.5 !text-[11px]">Reopen</Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent applications */}
        <section>
          <h2 className="border-b-2 border-ink pb-2 font-display text-2xl font-black">Latest filings</h2>
          <div className="mt-4 space-y-3">
            {recentApps.length === 0 && <p className="text-sm text-ink-faint">No applications yet.</p>}
            {recentApps.map((a) => (
              <Link key={a.id} href={`/dashboard/recruiter/applications/${a.id}`} className="card block p-4 hover:border-ink">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-bold">{a.candidate.name}</p>
                    <p className="text-sm text-ink-soft">{a.job.title}</p>
                    <p className="dateline mt-1">{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                  <StageBadge stage={a.stage} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
