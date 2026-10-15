"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StageBadge from "./StageBadge";
import { STAGE_LABEL } from "@/lib/format";

const STAGES = ["APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED", "REJECTED"] as const;

interface Props {
  application: {
    id: string;
    stage: string;
    coverNote: string | null;
    notes: string | null;
    createdAt: string;
    job: { id: string; title: string; company: string };
    candidate: {
      name: string;
      email: string;
      profile: {
        headline: string | null;
        location: string | null;
        skills: string[];
        experience: string | null;
        education: string | null;
        resumeKey: string | null;
        resumeName: string | null;
      } | null;
    };
  };
}

export default function ApplicationDetail({ application }: Props) {
  const [stage, setStage] = useState(application.stage);
  const [notes, setNotes] = useState(application.notes || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const profile = application.candidate.profile;

  async function save(patch: { stage?: string; notes?: string }) {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      if (patch.stage) setStage(data.application.stage);
      setMsg("Desk notes updated.");
      router.refresh();
    } else {
      setMsg(data.error || "Update failed");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Dossier */}
      <div className="lg:col-span-2">
        <div className="card p-6">
          <p className="kicker mb-2">Candidate dossier</p>
          <h1 className="font-display text-3xl font-black">{application.candidate.name}</h1>
          <p className="mt-1 text-ink-soft">
            {application.candidate.email}
            {profile?.location ? ` · ${profile.location}` : ""}
          </p>
          {profile?.headline && <p className="mt-2 font-display text-lg font-bold text-oxblood">{profile.headline}</p>}

          {profile?.skills?.length ? (
            <div className="mt-4">
              <p className="label">Skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span key={s} className="border border-hairline bg-paper-deep px-2.5 py-1 text-sm">{s}</span>
                ))}
              </div>
            </div>
          ) : null}

          {profile?.experience && (
            <div className="mt-4">
              <p className="label">Experience</p>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">{profile.experience}</p>
            </div>
          )}

          {profile?.education && (
            <div className="mt-4">
              <p className="label">Education</p>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">{profile.education}</p>
            </div>
          )}

          {!profile && <p className="mt-4 text-sm italic text-ink-faint">The candidate has not filled in a profile yet.</p>}
        </div>

        {application.coverNote && (
          <div className="card mt-4 p-6">
            <p className="label">Cover note</p>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">{application.coverNote}</p>
          </div>
        )}

        <div className="card mt-4 p-6">
          <p className="label">Résumé</p>
          {profile?.resumeKey ? (
            <a
              href={`/api/files/${encodeURIComponent(profile.resumeKey)}`}
              className="btn-outline mt-1"
            >
              ⬇ Download {profile.resumeName || "résumé"} (PDF)
            </a>
          ) : (
            <p className="text-sm italic text-ink-faint">No résumé on file for this candidate.</p>
          )}
        </div>
      </div>

      {/* Verdict column */}
      <aside className="card h-fit p-6">
        <p className="kicker mb-2">Editorial verdict</p>
        <div className="flex items-center gap-3">
          <StageBadge stage={stage} />
          <span className="dateline">
            Filed {new Date(application.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        <p className="label mt-5">Move to stage</p>
        <div className="grid grid-cols-1 gap-2">
          {STAGES.map((s) => (
            <button
              key={s}
              disabled={busy || s === stage}
              onClick={() => save({ stage: s })}
              className={`border px-3 py-2 text-left font-display text-sm font-bold uppercase tracking-wider ${
                s === stage ? "border-ink bg-ink text-paper" : "border-hairline hover:border-ink"
              } disabled:opacity-60`}
            >
              {STAGE_LABEL[s]}
            </button>
          ))}
        </div>

        <p className="label mt-5">Private notes <span className="normal-case tracking-normal text-ink-faint">(only your desk sees these)</span></p>
        <textarea
          className="field min-h-[110px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Strong React fundamentals; ask about the meeting-summarizer project…"
        />
        <button disabled={busy} onClick={() => save({ notes })} className="btn-press mt-3 w-full">
          {busy ? "Saving…" : "Save notes"}
        </button>
        {msg && <p className="mt-3 text-sm text-ink-soft">{msg}</p>}
      </aside>
    </div>
  );
}
