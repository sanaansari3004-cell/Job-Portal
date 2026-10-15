"use client";

import Link from "next/link";
import { useState } from "react";
import { STAGE_LABEL } from "@/lib/format";

const STAGES = ["APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED"] as const;
const TERMINAL = "REJECTED";

export interface PipeApp {
  id: string;
  stage: string;
  createdAt: string;
  candidate: { id: string; name: string; email: string; profile: { headline: string | null; location: string | null; resumeKey: string | null } | null };
}

const NEXT: Record<string, string> = {
  APPLIED: "SHORTLISTED",
  SHORTLISTED: "INTERVIEW",
  INTERVIEW: "HIRED",
};

const PREV: Record<string, string> = {
  SHORTLISTED: "APPLIED",
  INTERVIEW: "SHORTLISTED",
  HIRED: "INTERVIEW",
};

export default function PipelineBoard({ initial }: { initial: PipeApp[] }) {
  const [apps, setApps] = useState<PipeApp[]>(initial);
  const [moving, setMoving] = useState<string | null>(null);

  async function move(id: string, stage: string) {
    setMoving(id);
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    setMoving(null);
    if (res.ok) {
      const data = await res.json();
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, stage: data.application.stage } : a)));
    }
  }

  const inPipeline = apps.filter((a) => a.stage !== TERMINAL);
  const rejected = apps.filter((a) => a.stage === TERMINAL);

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => {
          const col = inPipeline.filter((a) => a.stage === stage);
          return (
            <section key={stage} className="card flex min-h-[300px] flex-col p-3">
              <header className="border-b-2 border-ink pb-2">
                <h2 className="font-display text-sm font-black uppercase tracking-[0.14em]">{STAGE_LABEL[stage]}</h2>
                <p className="dateline">{col.length} in this column</p>
              </header>
              <div className="mt-3 flex-1 space-y-2">
                {col.map((a) => (
                  <article key={a.id} className={`border p-3 ${moving === a.id ? "opacity-50" : ""} border-hairline bg-paper`}>
                    <Link href={`/dashboard/recruiter/applications/${a.id}`} className="font-display font-bold hover:text-oxblood">
                      {a.candidate.name}
                    </Link>
                    <p className="text-xs text-ink-soft">{a.candidate.profile?.headline || a.candidate.email}</p>
                    <p className="dateline mt-1">
                      {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {a.candidate.profile?.resumeKey ? " · résumé on file" : " · no résumé"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {PREV[stage] && (
                        <button
                          onClick={() => move(a.id, PREV[stage])}
                          disabled={moving === a.id}
                          className="border border-hairline px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider hover:border-ink"
                          title={`Move back to ${STAGE_LABEL[PREV[stage]]}`}
                        >
                          ←
                        </button>
                      )}
                      {NEXT[stage] && (
                        <button
                          onClick={() => move(a.id, NEXT[stage])}
                          disabled={moving === a.id}
                          className="border border-ink bg-ink px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-paper hover:bg-oxblood hover:border-oxblood"
                          title={`Advance to ${STAGE_LABEL[NEXT[stage]]}`}
                        >
                          → {STAGE_LABEL[NEXT[stage]]}
                        </button>
                      )}
                      <button
                        onClick={() => move(a.id, TERMINAL)}
                        disabled={moving === a.id}
                        className="border border-oxblood/40 px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-oxblood hover:bg-oxblood hover:text-paper"
                        title="Reject"
                      >
                        ✕
                      </button>
                    </div>
                  </article>
                ))}
                {col.length === 0 && <p className="p-2 text-sm italic text-ink-faint">Empty column.</p>}
              </div>
            </section>
          );
        })}
      </div>

      {rejected.length > 0 && (
        <section className="mt-6">
          <h2 className="border-b border-hairline pb-2 font-display text-sm font-black uppercase tracking-[0.14em] text-ink-faint">
            Rejected · {rejected.length}
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {rejected.map((a) => (
              <div key={a.id} className="flex items-center justify-between border border-hairline bg-paper-deep/60 p-3 opacity-70">
                <Link href={`/dashboard/recruiter/applications/${a.id}`} className="font-display text-sm font-bold hover:text-oxblood">
                  {a.candidate.name}
                </Link>
                <button
                  onClick={() => move(a.id, "APPLIED")}
                  disabled={moving === a.id}
                  className="font-display text-[11px] font-bold uppercase tracking-wider text-oxblood underline"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
