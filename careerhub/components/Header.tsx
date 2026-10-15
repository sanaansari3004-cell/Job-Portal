"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  role: "CANDIDATE" | "RECRUITER" | "ADMIN";
}

export default function Header() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const dashboard =
    user?.role === "RECRUITER"
      ? "/dashboard/recruiter"
      : user?.role === "ADMIN"
        ? "/admin"
        : "/dashboard/candidate";

  return (
    <header className="border-b border-ink">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-3">
          <span className="dateline hidden sm:block">Est. 2026 · New Delhi</span>
          <Link href="/" className="text-center">
            <span className="font-display text-3xl font-black tracking-tight">
              Career<span className="text-oxblood">Hub</span>
            </span>
            <span className="block font-display text-[10px] uppercase tracking-[0.3em] text-ink-faint">
              The Employment Gazette
            </span>
          </Link>
          <span className="dateline hidden sm:block">
            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
      </div>
      <nav className="border-t border-hairline bg-paper-deep/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <div className="flex items-center gap-6 font-display text-[13px] font-bold uppercase tracking-[0.14em]">
            <Link href="/jobs" className="hover:text-oxblood">Browse Jobs</Link>
            {user && (
              <Link href={dashboard} className="hover:text-oxblood">
                {user.role === "CANDIDATE" ? "My Desk" : user.role === "RECRUITER" ? "Newsroom" : "Press Office"}
              </Link>
            )}
            {user?.role === "RECRUITER" && (
              <Link href="/dashboard/recruiter/jobs/new" className="hover:text-oxblood">Post a Job</Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {user === undefined ? null : user ? (
              <>
                <span className="hidden text-sm text-ink-soft md:block">
                  {user.name} · <span className="kicker">{user.role}</span>
                </span>
                <button onClick={logout} className="font-display text-[13px] font-bold uppercase tracking-[0.14em] hover:text-oxblood">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="font-display text-[13px] font-bold uppercase tracking-[0.14em] hover:text-oxblood">
                  Sign in
                </Link>
                <Link href="/register" className="btn-press !px-4 !py-1.5 !text-[12px]">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
