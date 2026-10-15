"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CloseJobButton({ jobId }: { jobId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function close() {
    if (!confirm("Close this listing? It will stop accepting new applications.")) return;
    setBusy(true);
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={close} disabled={busy} className="btn-outline !px-3 !py-1.5 !text-[11px] hover:!bg-oxblood hover:!border-oxblood">
      {busy ? "…" : "Close"}
    </button>
  );
}
