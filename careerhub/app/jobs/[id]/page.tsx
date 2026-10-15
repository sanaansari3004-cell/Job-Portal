import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { salaryBand, JOB_TYPE_LABEL } from "@/lib/format";
import ApplyForm from "@/components/ApplyForm";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();

  const job = await prisma.job
    .findUnique({
      where: { id: params.id },
      include: { _count: { select: { applications: true } } },
    })
    .catch(() => null);

  if (!job) {
    notFound();
  }

  if (job.status === "CLOSED") {
    // Recruiters see their own closed listings; candidates see jobs they applied to.
    const canView =
      session?.role === "ADMIN" ||
      (session?.role === "RECRUITER" && job.recruiterId === session.id) ||
      (session &&
        (await prisma.application
          .findUnique({
            where: { jobId_candidateId: { jobId: job.id, candidateId: session.id } },
            select: { id: true },
          })
          .catch(() => null)));
    if (!canView) notFound();
  }

  let alreadyApplied = false;
  let hasResume = false;
  if (session?.role === "CANDIDATE") {
    const [app, profile] = await Promise.all([
      prisma.application.findUnique({
        where: { jobId_candidateId: { jobId: job.id, candidateId: session.id } },
        select: { id: true },
      }),
      prisma.profile.findUnique({ where: { userId: session.id }, select: { resumeKey: true } }),
    ]).catch(() => [null, null] as const);
    alreadyApplied = !!app;
    hasResume = !!profile?.resumeKey;
  }

  return (
    <article>
      <Link href="/jobs" className="font-display text-xs font-bold uppercase tracking-[0.14em] text-oxblood hover:underline">
        ← Back to classifieds
      </Link>

      <header className="mt-4 border-b-2 border-ink pb-6">
        <p className="kicker">{job.category} · {JOB_TYPE_LABEL[job.jobType]}</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl">{job.title}</h1>
        <p className="mt-3 text-lg text-ink-soft">
          {job.company} · {job.location} · {job.experience}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="font-display text-2xl font-black text-oxblood">{salaryBand(job.salaryMin, job.salaryMax)}</p>
          <span className="dateline">
            Published {new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
            {job._count.applications} application{job._count.applications === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <section>
            <h2 className="font-display text-xl font-black">The brief</h2>
            <div className="prose-news mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
              {job.description}
            </div>
          </section>
          {job.requirements && (
            <section className="mt-8">
              <h2 className="font-display text-xl font-black">What the desk expects</h2>
              <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">
                {job.requirements}
              </div>
            </section>
          )}
        </div>

        <aside>
          {job.status === "CLOSED" && (
            <div className="card border-oxblood/40 p-5">
              <p className="kicker">Listing closed</p>
              <p className="mt-2 text-sm text-ink-soft">
                This position is no longer accepting applications.
              </p>
            </div>
          )}

          {!session && job.status === "OPEN" && (
            <div className="card p-5">
              <h2 className="font-display text-xl font-black">Interested?</h2>
              <p className="mt-2 text-sm text-ink-soft">Sign in as a candidate to file your application.</p>
              <Link href={`/login?next=/jobs/${job.id}`} className="btn-press mt-4 w-full">Sign in to apply</Link>
              <Link href="/register" className="btn-outline mt-2 w-full">Create an account</Link>
            </div>
          )}

          {session?.role === "CANDIDATE" && alreadyApplied && (
            <div className="card border-ink p-5">
              <p className="kicker">Already on file</p>
              <p className="mt-2 text-sm text-ink-soft">
                You have applied to this role. Track its progress on your desk.
              </p>
              <Link href="/dashboard/candidate" className="btn-outline mt-4 w-full">Open application tracker</Link>
            </div>
          )}

          {session?.role === "CANDIDATE" && !alreadyApplied && job.status === "OPEN" && (
            <ApplyForm jobId={job.id} jobTitle={job.title} hasResume={hasResume} />
          )}

          {session && session.role !== "CANDIDATE" && (
            <div className="card p-5">
              <p className="text-sm text-ink-soft">
                You are signed in as a <strong>{session.role.toLowerCase()}</strong>. Only candidate accounts can apply.
              </p>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
