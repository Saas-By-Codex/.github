"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = ["OWNER", "ADMIN", "MANAGER", "VIEWER"];

export function RoleSelect({
  memberId,
  role,
  disabled,
}: {
  memberId: string;
  role: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    setValue(next);
    setBusy(true);
    await fetch("/api/members/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role: next }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <select
      className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:opacity-60"
      value={value}
      disabled={disabled || busy}
      onChange={(e) => change(e.target.value)}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}
