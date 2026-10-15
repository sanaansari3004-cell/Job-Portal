"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApplyForm({ jobId, jobTitle, hasResume }: { jobId: string; jobTitle: string; hasResume: boolean }) {
  const [coverNote, setCoverNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, coverNote }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Application failed");
      return;
    }
    router.push("/dashboard/candidate");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card mt-6 p-5">
      <h2 className="font-display text-xl font-black">File your application</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Applying for <strong>{jobTitle}</strong>. Your profile résumé on file will be attached automatically.
      </p>
      {!hasResume && (
        <p className="mt-3 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          You have no résumé on file yet — you can still apply, but{" "}
          <a href="/dashboard/candidate/profile" className="font-bold underline">upload one first</a> for a stronger application.
        </p>
      )}
      <label className="label mt-4" htmlFor="cover">Cover note <span className="normal-case tracking-normal text-ink-faint">(optional, 2000 chars)</span></label>
      <textarea
        id="cover"
        className="field min-h-[120px]"
        placeholder="Dear hiring desk — in two or three sentences, why are you the right correspondent for this beat?"
        value={coverNote}
        onChange={(e) => setCoverNote(e.target.value)}
        maxLength={2000}
      />
      {err && <p className="mt-3 border border-oxblood/40 bg-oxblood/10 p-3 text-sm text-oxblood">{err}</p>}
      <button type="submit" disabled={busy} className="btn-press mt-4 w-full">
        {busy ? "Filing…" : "Submit application"}
      </button>
    </form>
  );
}
