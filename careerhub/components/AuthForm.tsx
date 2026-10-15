"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CANDIDATE");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "register" ? { name, email, password, role } : { email, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Something went wrong");
      return;
    }
    const next = searchParams.get("next");
    const r: string = data.user.role;
    router.push(next || (r === "ADMIN" ? "/admin" : r === "RECRUITER" ? "/dashboard/recruiter" : "/dashboard/candidate"));
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="kicker mb-2">{mode === "login" ? "Sign in" : "Join the gazette"}</p>
      <h1 className="font-display text-4xl font-black tracking-tight">
        {mode === "login" ? "Welcome back to the desk." : "Start your byline."}
      </h1>

      <form onSubmit={submit} className="card mt-6 p-6">
        {mode === "register" && (
          <div className="mb-4">
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Aarav Sharma" />
          </div>
        )}
        <div className="mb-4">
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <div className="mb-4">
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder={mode === "register" ? "Min. 8 characters" : "Your password"} />
        </div>
        {mode === "register" && (
          <div className="mb-4">
            <label className="label">I am joining as</label>
            <div className="grid grid-cols-2 gap-2">
              {(["CANDIDATE", "RECRUITER"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`border px-3 py-2.5 font-display text-sm font-bold uppercase tracking-wider ${role === r ? "border-ink bg-ink text-paper" : "border-hairline hover:border-ink"}`}
                >
                  {r === "CANDIDATE" ? "Candidate" : "Recruiter"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-faint">Admin accounts are created by seed script only.</p>
          </div>
        )}
        {err && <p className="mb-4 border border-oxblood/40 bg-oxblood/10 p-3 text-sm text-oxblood">{err}</p>}
        <button type="submit" disabled={busy} className="btn-press w-full">
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <p className="mt-4 text-center text-sm text-ink-soft">
          {mode === "login" ? (
            <>New to CareerHub? <Link href="/register" className="font-bold text-oxblood underline">Register</Link></>
          ) : (
            <>Already have an account? <Link href="/login" className="font-bold text-oxblood underline">Sign in</Link></>
          )}
        </p>
      </form>

      {mode === "login" && (
        <div className="card mt-4 border-dashed p-4">
          <p className="dateline mb-2">Demo credentials (after seeding)</p>
          <ul className="space-y-1 font-mono text-xs">
            <li>candidate@careerhub.local · password123</li>
            <li>recruiter@careerhub.local · password123</li>
            <li>admin@careerhub.local · password123</li>
          </ul>
        </div>
      )}
    </div>
  );
}
