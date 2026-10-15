import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import JobForm from "@/components/JobForm";

export const dynamic = "force-dynamic";

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const job = await prisma.job.findUnique({ where: { id: params.id } }).catch(() => null);
  if (!job) notFound();
  if (session.role !== "ADMIN" && job.recruiterId !== session.id) redirect("/dashboard/recruiter");

  return (
    <div className="mx-auto max-w-3xl">
      <p className="kicker mb-2">Recruiting desk</p>
      <h1 className="font-display text-4xl font-black tracking-tight">Revise the listing</h1>
      <p className="dateline mt-2">{job.title} · {job.company}</p>
      <div className="mt-6">
        <JobForm
          jobId={job.id}
          initial={{
            title: job.title,
            company: job.company,
            location: job.location,
            jobType: job.jobType,
            category: job.category,
            experience: job.experience,
            salaryMin: job.salaryMin ? String(job.salaryMin) : "",
            salaryMax: job.salaryMax ? String(job.salaryMax) : "",
            description: job.description,
            requirements: job.requirements,
            status: job.status,
          }}
        />
      </div>
    </div>
  );
}
