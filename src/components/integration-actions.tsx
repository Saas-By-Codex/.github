"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * In demo mode "Connect" simulates an OAuth grant by sending a mock token to
 * the API, which encrypts and stores it. A real deployment would redirect to
 * the manufacturer's OAuth consent screen instead.
 */
export function ConnectButton({ provider, connected }: { provider: string; connected: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        accessToken: `demo-oauth-token-${provider.toLowerCase()}`,
        scopes: "read",
      }),
    });
    setBusy(false);
    router.refresh();
  }

  async function disconnect() {
    setBusy(true);
    await fetch(`/api/integrations/${provider}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return connected ? (
    <button className="btn-secondary" disabled={busy} onClick={disconnect}>
      {busy ? "…" : "Disconnect"}
    </button>
  ) : (
    <button className="btn-primary" disabled={busy} onClick={connect}>
      {busy ? "Connecting…" : "Connect"}
    </button>
  );
}
