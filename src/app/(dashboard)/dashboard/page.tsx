import Link from "next/link";
import { requireContext } from "@/lib/session";
import { getChargingSummary, getEsgReport, getFleetSummary } from "@/lib/metrics";
import { prisma } from "@/lib/db";
import { Card, EmptyState, PageHeader, StatCard, Badge } from "@/components/ui";
import { CostBarChart } from "@/components/charts";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const ctx = await requireContext();
  const [summary, charging, esg, recentAlerts] = await Promise.all([
    getFleetSummary(ctx.organizationId),
    getChargingSummary(ctx.organizationId, 30),
    getEsgReport(ctx.organizationId, 90),
    prisma.maintenanceAlert.findMany({
      where: { vehicle: { organizationId: ctx.organizationId }, status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { vehicle: true },
    }),
  ]);

  if (summary.totalVehicles === 0) {
    return (
      <>
        <PageHeader title="Dashboard" description="Fleet overview at a glance." />
        <EmptyState
          icon="🚗"
          title="No vehicles yet"
          description="Connect an integration or load demo data to start monitoring your EV fleet."
          action={
            <div className="flex gap-2">
              <Link href="/integrations" className="btn-primary">Connect a vehicle</Link>
              <Link href="/vehicles" className="btn-secondary">Add manually</Link>
            </div>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live overview of your EV fleet."
        action={<Link href="/vehicles" className="btn-secondary">View vehicles</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vehicles" value={summary.totalVehicles} hint={`${summary.activeVehicles} active`} />
        <StatCard label="Charging now" value={summary.chargingNow} accent="green" hint="vehicles plugged in" />
        <StatCard label="Avg battery" value={`${formatNumber(summary.avgBatteryLevel)}%`} hint={`Health ${formatNumber(summary.avgBatteryHealth)}%`} />
        <StatCard
          label="Open alerts"
          value={summary.openAlerts}
          accent={summary.openAlerts > 0 ? "amber" : "green"}
          hint="maintenance"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold">Charging cost — last 30 days</h2>
          {charging.series.length ? (
            <CostBarChart data={charging.series.map((s) => ({ date: s.date.slice(5), cost: s.cost }))} />
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">No charging sessions yet.</p>
          )}
          <div className="mt-4 flex gap-6 text-sm text-slate-500">
            <span>Total: <strong className="text-slate-800">{formatCurrency(charging.totalCost)}</strong></span>
            <span>Energy: <strong className="text-slate-800">{formatNumber(charging.totalEnergyKwh)} kWh</strong></span>
            <span>Sessions: <strong className="text-slate-800">{charging.sessionCount}</strong></span>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">ESG impact — 90 days</h2>
          <div className="space-y-3">
            <div className="rounded-lg bg-brand-50 p-4">
              <div className="text-3xl font-semibold text-brand-700">{formatNumber(esg.savedCo2Kg)} kg</div>
              <div className="text-sm text-brand-600">CO₂ saved vs. combustion fleet</div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Distance</span>
              <strong>{formatNumber(esg.distanceKm)} km</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Gasoline displaced</span>
              <strong>{formatNumber(esg.litresGasolineDisplaced)} L</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">≈ trees / year</span>
              <strong>{formatNumber(esg.treesEquivalent)}</strong>
            </div>
          </div>
          <Link href="/esg" className="btn-secondary mt-4 w-full">Full ESG report</Link>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent maintenance alerts</h2>
            <Link href="/maintenance" className="text-sm font-medium text-brand-600">View all</Link>
          </div>
          {recentAlerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No open alerts — your fleet is healthy. 🎉</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentAlerts.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-slate-800">{a.title}</div>
                    <div className="text-sm text-slate-500">{a.vehicle.name}</div>
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
