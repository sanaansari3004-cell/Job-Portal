import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { salaryBand } from "@/lib/format";
import StageBadge from "@/components/StageBadge";

export const dynamic = "force-dynamic";

const STAGE_ORDER = ["APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"];
const STAGE_HELP: Record<string, string> = {
  APPLIED: "Your application is on the recruiter's desk.",
  SHORTLISTED: "The desk liked your byline — you're on the shortlist.",
  INTERVIEW: "You've been called in for an interview.",
  HIRED: "Congratulations — offer stage. The desk will be in touch.",
  REJECTED: "Not this time. Your profile stays on file for other roles.",
};

export default async function CandidateDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/candidate");

  const applications = await prisma.application
    .findMany({
      where: { candidateId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        job: { select: { id: true, title: true, company: true, location: true, status: true, salaryMin: true, salaryMax: true } },
      },
    })
    .catch(() => []);

  const counts = STAGE_ORDER.map((s) => ({ stage: s, n: applications.filter((a) => a.stage === s).length }));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="kicker mb-2">Candidate desk</p>
          <h1 className="font-display text-4xl font-black tracking-tight">Application tracker</h1>
          <p className="dateline mt-2">Every filing, and exactly where it sits in the pipeline</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/candidate/profile" className="btn-outline">Edit profile</Link>
          <Link href="/jobs" className="btn-press">Find roles</Link>
        </div>
      </div>

      {/* Pipeline summary strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {counts.map((c) => (
          <div key={c.stage} className="card p-4 text-center">
            <p className="font-display text-3xl font-black">{c.n}</p>
            <div className="mt-1"><StageBadge stage={c.stage} /></div>
          </div>
        ))}
      </div>

      {/* Tracker list */}
      <div className="mt-8 space-y-4">
        {applications.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-display text-xl font-bold">No applications filed yet.</p>
            <p className="mt-2 text-ink-soft">Browse the classifieds and file your first application.</p>
            <Link href="/jobs" className="btn-press mt-4">Browse jobs</Link>
          </div>
        )}
        {applications.map((a) => (
          <div key={a.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/jobs/${a.job.id}`} className="font-display text-xl font-bold hover:text-oxblood">
                  {a.job.title}
                </Link>
                <p className="mt-1 text-sm text-ink-soft">
                  {a.job.company} · {a.job.location} · {salaryBand(a.job.salaryMin, a.job.salaryMax)}
                  {a.job.status === "CLOSED" && <span className="ml-2 text-oxblood">(listing closed)</span>}
                </p>
                <p className="dateline mt-2">
                  Filed {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <StageBadge stage={a.stage} />
            </div>
            <p className="mt-3 border-l-2 border-hairline pl-3 text-sm text-ink-soft">{STAGE_HELP[a.stage]}</p>
            {a.coverNote && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-display text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
                  Your cover note
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-ink-soft">{a.coverNote}</p>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
