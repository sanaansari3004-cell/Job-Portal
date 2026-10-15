"use client";

import { useEffect, useState } from "react";

interface Profile {
  headline: string | null;
  location: string | null;
  skills: string[];
  experience: string | null;
  education: string | null;
  resumeKey: string | null;
  resumeName: string | null;
}

export default function ProfileEditor() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeKey, setResumeKey] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const p: Profile = d.profile;
        setName(d.user?.name || "");
        setHeadline(p.headline || "");
        setLocation(p.location || "");
        setSkillsText((p.skills || []).join(", "));
        setExperience(p.experience || "");
        setEducation(p.education || "");
        setResumeName(p.resumeName);
        setResumeKey(p.resumeKey);
        setLoading(false);
      })
      .catch(() => {
        setErr("Could not load profile.");
        setLoading(false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setErr("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        headline,
        location,
        skills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
        experience,
        education,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setErr(data.error || "Save failed");
      return;
    }
    setMsg("Profile saved to the gazette.");
  }

  async function uploadResume(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr("");
    setMsg("");
    const form = new FormData();
    form.append("resume", file);
    const res = await fetch("/api/resume", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    e.target.value = "";
    if (!res.ok) {
      setErr(data.error || "Upload failed");
      return;
    }
    setResumeName(data.resume.name);
    setResumeKey(data.resume.key);
    setMsg(`Résumé uploaded (${data.resume.driver} storage).`);
  }

  if (loading) return <p className="text-ink-soft">Loading your file…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={save} className="card p-6 lg:col-span-2">
        <h2 className="font-display text-2xl font-black">Your byline</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="headline">Headline</label>
            <input id="headline" className="field" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Full-stack developer · React, Node" />
          </div>
          <div>
            <label className="label" htmlFor="location">Location</label>
            <input id="location" className="field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru" />
          </div>
          <div>
            <label className="label" htmlFor="skills">Skills <span className="normal-case tracking-normal text-ink-faint">(comma separated)</span></label>
            <input id="skills" className="field" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="React, TypeScript, PostgreSQL" />
          </div>
        </div>
        <div className="mt-4">
          <label className="label" htmlFor="experience">Experience</label>
          <textarea id="experience" className="field min-h-[110px]" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Roles, internships, notable work…" />
        </div>
        <div className="mt-4">
          <label className="label" htmlFor="education">Education</label>
          <textarea id="education" className="field min-h-[90px]" value={education} onChange={(e) => setEducation(e.target.value)} placeholder="BTech Computer Science, Quantum University (2027)…" />
        </div>
        {err && <p className="mt-4 border border-oxblood/40 bg-oxblood/10 p-3 text-sm text-oxblood">{err}</p>}
        {msg && <p className="mt-4 border border-green-700/30 bg-green-50 p-3 text-sm text-green-900">{msg}</p>}
        <button type="submit" disabled={saving} className="btn-press mt-4">
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <aside className="card h-fit p-6">
        <p className="kicker mb-2">Résumé on file</p>
        <h2 className="font-display text-2xl font-black">CV drawer</h2>
        {resumeName ? (
          <div className="mt-4 border border-hairline bg-paper-deep p-4">
            <p className="break-all font-mono text-sm">{resumeName}</p>
            <a
              href={`/api/files/${encodeURIComponent(resumeKey!)}`}
              className="mt-2 inline-block font-display text-xs font-bold uppercase tracking-[0.14em] text-oxblood underline"
            >
              Download your copy
            </a>
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">No résumé filed yet. Recruiters see applications with a résumé first.</p>
        )}
        <label className="label mt-4" htmlFor="resume">Upload PDF (max 5 MB)</label>
        <input
          id="resume"
          type="file"
          accept="application/pdf,.pdf"
          onChange={uploadResume}
          disabled={uploading}
          className="block w-full text-sm file:mr-3 file:border file:border-ink file:bg-ink file:px-4 file:py-2 file:font-display file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-paper hover:file:bg-oxblood hover:file:border-oxblood"
        />
        {uploading && <p className="mt-2 text-sm text-ink-soft">Uploading…</p>}
        <p className="dateline mt-3">Stored on local disk by default (see README)</p>
      </aside>
    </div>
  );
}
