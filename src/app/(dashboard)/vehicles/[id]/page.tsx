import { notFound } from "next/navigation";
import Link from "next/link";
import { requireContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, PageHeader, StatCard, Badge } from "@/components/ui";
import { BatteryTrendChart } from "@/components/charts";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

export default async function VehicleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireContext();
  // Scope by organization id to prevent cross-tenant access.
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
    include: {
      assignedDriver: true,
      telemetry: { orderBy: { recordedAt: "desc" }, take: 48 },
      chargingSessions: { orderBy: { startedAt: "desc" }, take: 10 },
      alerts: { where: { status: { not: "RESOLVED" } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!vehicle) notFound();

  const latest = vehicle.telemetry[0];
  const trend = [...vehicle.telemetry]
    .reverse()
    .map((t) => ({ time: formatDateTime(t.recordedAt).split(",")[0], level: t.batteryLevel }));

  return (
    <>
      <PageHeader
        title={vehicle.name}
        description={`${vehicle.make} ${vehicle.model}${vehicle.year ? ` · ${vehicle.year}` : ""}`}
        action={<Link href="/vehicles" className="btn-secondary">← Back</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Battery" value={latest ? `${formatNumber(latest.batteryLevel)}%` : "—"} accent="green" />
        <StatCard label="Health" value={latest ? `${formatNumber(latest.batteryHealth)}%` : "—"} />
        <StatCard label="Range" value={latest ? `${formatNumber(latest.rangeKm)} km` : "—"} />
        <StatCard label="Odometer" value={latest ? `${formatNumber(latest.odometerKm)} km` : "—"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold">Battery level trend</h2>
          {trend.length ? (
            <BatteryTrendChart data={trend} />
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">No telemetry recorded yet.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Details</h2>
          <dl className="space-y-2 text-sm">
            <Row k="Provider" v={<Badge tone="slate">{vehicle.provider}</Badge>} />
            <Row k="Status" v={<Badge tone="blue">{vehicle.status}</Badge>} />
            <Row k="VIN" v={vehicle.vin ?? "—"} />
            <Row k="Battery capacity" v={`${formatNumber(vehicle.batteryCapacityKwh)} kWh`} />
            <Row k="Rated range" v={`${formatNumber(vehicle.ratedRangeKm)} km`} />
            <Row k="Driver" v={vehicle.assignedDriver?.name ?? "Unassigned"} />
            {latest?.latitude != null && (
              <Row k="Location" v={`${latest.latitude.toFixed(3)}, ${latest.longitude?.toFixed(3)}`} />
            )}
          </dl>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Recent charging sessions</h2>
          {vehicle.chargingSessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No charging sessions.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {vehicle.chargingSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-medium text-slate-700">{formatDateTime(s.startedAt)}</div>
                    <div className="text-xs text-slate-400">
                      {s.locationType} · {formatNumber(s.startPercent)}% → {s.endPercent ? `${formatNumber(s.endPercent)}%` : "…"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatNumber(s.energyKwh)} kWh</div>
                    <div className="text-xs text-slate-400">{formatCurrency(s.costAmount, s.currency)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Open alerts</h2>
          {vehicle.alerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No open alerts. 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {vehicle.alerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-medium text-slate-700">{a.title}</div>
                    <div className="text-xs text-slate-400">{a.description}</div>
                  </div>
                  <Badge tone={a.severity === "CRITICAL" ? "red" : a.severity === "WARNING" ? "amber" : "slate"}>
                    {a.severity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-medium text-slate-800">{v}</dd>
    </div>
  );
}
