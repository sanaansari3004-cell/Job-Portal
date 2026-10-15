import JobForm from "@/components/JobForm";

export default function NewJobPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="kicker mb-2">Recruiting desk</p>
      <h1 className="font-display text-4xl font-black tracking-tight">Publish a listing</h1>
      <p className="dateline mt-2">Set it in type — it goes live on the classifieds immediately</p>
      <div className="mt-6">
        <JobForm />
      </div>
    </div>
  );
}
