"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddVehicleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add vehicle");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>+ Add vehicle</button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">Add vehicle</h2>
            {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div>
                <label className="label">Name</label>
                <input name="name" required className="input" placeholder="Delivery Van 1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Make</label>
                  <input name="make" required className="input" placeholder="Tesla" />
                </div>
                <div>
                  <label className="label">Model</label>
                  <input name="model" required className="input" placeholder="Model Y" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Battery (kWh)</label>
                  <input name="batteryCapacityKwh" type="number" step="0.1" className="input" defaultValue={60} />
                </div>
                <div>
                  <label className="label">Rated range (km)</label>
                  <input name="ratedRangeKm" type="number" step="1" className="input" defaultValue={400} />
                </div>
              </div>
              <div>
                <label className="label">Provider</label>
                <select name="provider" className="input" defaultValue="SIMULATED">
                  <option value="SIMULATED">Simulated (demo)</option>
                  <option value="TESLA">Tesla</option>
                  <option value="FORD">Ford</option>
                  <option value="HYUNDAI">Hyundai</option>
                  <option value="KIA">Kia</option>
                  <option value="BMW">BMW</option>
                  <option value="SMARTCAR">Smartcar</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function SeedDemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function seed() {
    setLoading(true);
    await fetch("/api/demo/seed", { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button className="btn-secondary" onClick={seed} disabled={loading}>
      {loading ? "Loading demo data…" : "🎲 Load demo data"}
    </button>
  );
}
