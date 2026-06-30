import { requireContext } from "@/lib/session";
import { getChargingSummary } from "@/lib/metrics";
import { prisma } from "@/lib/db";
import { Card, EmptyState, PageHeader, StatCard, Badge } from "@/components/ui";
import { CostBarChart, EnergyLineChart } from "@/components/charts";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

export default async function ChargingPage() {
  const ctx = await requireContext();
  const [summary, org, sessions] = await Promise.all([
    getChargingSummary(ctx.organizationId, 30),
    prisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } }),
    prisma.chargingSession.findMany({
      where: { vehicle: { organizationId: ctx.organizationId } },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: { vehicle: true },
    }),
  ]);

  if (sessions.length === 0) {
    return (
      <>
        <PageHeader title="Charging" description="Charging sessions, history and costs." />
        <EmptyState icon="🔌" title="No charging sessions" description="Charging history will appear here once vehicles start charging or demo data is loaded." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Charging"
        description={`Cost calculator uses ${formatCurrency(org.electricityPricePerKwh, org.currency)}/kWh (editable in Settings).`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sessions (30d)" value={summary.sessionCount} />
        <StatCard label="Energy (30d)" value={`${formatNumber(summary.totalEnergyKwh)} kWh`} />
        <StatCard label="Total cost (30d)" value={formatCurrency(summary.totalCost, org.currency)} accent="green" />
        <StatCard label="Avg / session" value={formatCurrency(summary.avgCostPerSession, org.currency)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Daily charging cost</h2>
          <CostBarChart data={summary.series.map((s) => ({ date: s.date.slice(5), cost: s.cost }))} />
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Daily energy (kWh)</h2>
          <EnergyLineChart data={summary.series.map((s) => ({ date: s.date.slice(5), energyKwh: s.energyKwh }))} />
        </Card>
      </div>

      <div className="mt-6">
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Started</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">SoC</th>
                <th className="px-5 py-3 font-medium">Energy</th>
                <th className="px-5 py-3 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{s.vehicle.name}</td>
                  <td className="px-5 py-3 text-slate-600">{formatDateTime(s.startedAt)}</td>
                  <td className="px-5 py-3"><Badge tone="slate">{s.locationType}</Badge></td>
                  <td className="px-5 py-3 text-slate-600">{formatNumber(s.startPercent)}% → {s.endPercent ? `${formatNumber(s.endPercent)}%` : "…"}</td>
                  <td className="px-5 py-3">{formatNumber(s.energyKwh)} kWh</td>
                  <td className="px-5 py-3 font-medium">{formatCurrency(s.costAmount, s.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
