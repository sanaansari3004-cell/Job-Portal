import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import PipelineBoard from "@/components/PipelineBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const job = await prisma.job.findUnique({ where: { id: params.id } }).catch(() => null);
  if (!job) notFound();
  if (session.role !== "ADMIN" && job.recruiterId !== session.id) redirect("/dashboard/recruiter");

  const applications = await prisma.application
    .findMany({
      where: { jobId: job.id },
      orderBy: { createdAt: "desc" },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { headline: true, location: true, resumeKey: true } },
          },
        },
      },
    })
    .catch(() => []);

  const initial = applications.map((a) => ({
    id: a.id,
    stage: a.stage,
    createdAt: a.createdAt.toISOString(),
    candidate: a.candidate,
  }));

  return (
    <div>
      <Link href="/dashboard/recruiter" className="font-display text-xs font-bold uppercase tracking-[0.14em] text-oxblood hover:underline">
        ← Back to newsroom
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker mb-2">Pipeline</p>
          <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">{job.title}</h1>
          <p className="dateline mt-2">
            {job.company} · {job.location} · {applications.length} application{applications.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href={`/dashboard/recruiter/jobs/${job.id}/edit`} className="btn-outline">Edit listing</Link>
      </div>
      <div className="mt-6">
        <PipelineBoard initial={initial} />
      </div>
    </div>
  );
}
