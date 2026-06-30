"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AlertActions({ alertId, status }: { alertId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(next: "ACKNOWLEDGED" | "RESOLVED") {
    setBusy(true);
    await fetch(`/api/alerts/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  if (status === "RESOLVED") return <span className="text-xs text-slate-400">Resolved</span>;

  return (
    <div className="flex gap-2">
      {status === "OPEN" && (
        <button className="btn-secondary px-2.5 py-1 text-xs" disabled={busy} onClick={() => update("ACKNOWLEDGED")}>
          Acknowledge
        </button>
      )}
      <button className="btn-primary px-2.5 py-1 text-xs" disabled={busy} onClick={() => update("RESOLVED")}>
        Resolve
      </button>
    </div>
  );
}
