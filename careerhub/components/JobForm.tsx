"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/format";

interface JobValues {
  title: string;
  company: string;
  location: string;
  jobType: string;
  category: string;
  experience: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
  requirements: string;
  status: string;
}

const EMPTY: JobValues = {
  title: "",
  company: "",
  location: "",
  jobType: "FULL_TIME",
  category: "Engineering",
  experience: "0-2 years",
  salaryMin: "",
  salaryMax: "",
  description: "",
  requirements: "",
  status: "OPEN",
};

export default function JobForm({ jobId, initial }: { jobId?: string; initial?: Partial<JobValues> }) {
  const [v, setV] = useState<JobValues>({ ...EMPTY, ...initial });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  function set<K extends keyof JobValues>(k: K, val: string) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const payload = {
      ...v,
      salaryMin: v.salaryMin === "" ? null : v.salaryMin,
      salaryMax: v.salaryMax === "" ? null : v.salaryMax,
    };
    const res = await fetch(jobId ? `/api/jobs/${jobId}` : "/api/jobs", {
      method: jobId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Save failed");
      return;
    }
    const id = jobId ?? data.job.id;
    router.push(`/dashboard/recruiter/jobs/${id}/pipeline`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="title">Job title *</label>
          <input id="title" className="field" value={v.title} onChange={(e) => set("title", e.target.value)} required placeholder="Frontend Developer (React)" />
        </div>
        <div>
          <label className="label" htmlFor="company">Company *</label>
          <input id="company" className="field" value={v.company} onChange={(e) => set("company", e.target.value)} required placeholder="Acme Technologies" />
        </div>
        <div>
          <label className="label" htmlFor="location">Location *</label>
          <input id="location" className="field" value={v.location} onChange={(e) => set("location", e.target.value)} required placeholder="Bengaluru / Remote" />
        </div>
        <div>
          <label className="label" htmlFor="jobType">Job type</label>
          <select id="jobType" className="field" value={v.jobType} onChange={(e) => set("jobType", e.target.value)}>
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERNSHIP">Internship</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="category">Desk (category) *</label>
          <select id="category" className="field" value={v.category} onChange={(e) => set("category", e.target.value)}>
            {(CATEGORIES as readonly string[]).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="experience">Experience</label>
          <select id="experience" className="field" value={v.experience} onChange={(e) => set("experience", e.target.value)}>
            {["Fresher", "0-2 years", "2-5 years", "5+ years"].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" className="field" value={v.status} onChange={(e) => set("status", e.target.value)}>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="salaryMin">Min salary (₹ / year)</label>
          <input id="salaryMin" type="number" min={0} className="field" value={v.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} placeholder="600000" />
        </div>
        <div>
          <label className="label" htmlFor="salaryMax">Max salary (₹ / year)</label>
          <input id="salaryMax" type="number" min={0} className="field" value={v.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} placeholder="1200000" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">Job description *</label>
          <textarea id="description" className="field min-h-[160px]" value={v.description} onChange={(e) => set("description", e.target.value)} required placeholder="What the role is, what the team does, day-to-day…" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="requirements">Requirements</label>
          <textarea id="requirements" className="field min-h-[120px]" value={v.requirements} onChange={(e) => set("requirements", e.target.value)} placeholder="Must-haves, nice-to-haves…" />
        </div>
      </div>
      {err && <p className="mt-4 border border-oxblood/40 bg-oxblood/10 p-3 text-sm text-oxblood">{err}</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={busy} className="btn-press">
          {busy ? "Publishing…" : jobId ? "Save changes" : "Publish listing"}
        </button>
      </div>
    </form>
  );
}
