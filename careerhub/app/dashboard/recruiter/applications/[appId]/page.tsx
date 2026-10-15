import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ApplicationDetail from "@/components/ApplicationDetail";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({ params }: { params: { appId: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const application = await prisma.application
    .findUnique({
      where: { id: params.appId },
      include: {
        job: { select: { id: true, title: true, company: true, recruiterId: true } },
        candidate: {
          select: {
            name: true,
            email: true,
            profile: {
              select: {
                headline: true, location: true, skills: true, experience: true,
                education: true, resumeKey: true, resumeName: true,
              },
            },
          },
        },
      },
    })
    .catch(() => null);

  if (!application) notFound();
  if (session.role !== "ADMIN" && application.job.recruiterId !== session.id) redirect("/dashboard/recruiter");

  const serialised = {
    ...application,
    createdAt: application.createdAt.toISOString(),
  };

  return (
    <div>
      <Link
        href={`/dashboard/recruiter/jobs/${application.job.id}/pipeline`}
        className="font-display text-xs font-bold uppercase tracking-[0.14em] text-oxblood hover:underline"
      >
        ← Back to pipeline · {application.job.title}
      </Link>
      <div className="mt-4">
        <ApplicationDetail application={serialised} />
      </div>
    </div>
  );
}
