import Link from "next/link";
import { requireContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { formatNumber } from "@/lib/utils";

function healthTone(h: number): string {
  if (h >= 92) return "bg-brand-500";
  if (h >= 85) return "bg-amber-500";
  return "bg-red-500";
}

export default async function BatteryPage() {
  const ctx = await requireContext();
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: ctx.organizationId },
    include: { telemetry: { orderBy: { recordedAt: "desc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  const withT = vehicles
    .map((v) => ({ vehicle: v, t: v.telemetry[0] }))
    .filter((x) => x.t);

  if (withT.length === 0) {
    return (
      <>
        <PageHeader title="Battery Health" description="State of health across the fleet." />
        <EmptyState icon="🔋" title="No battery data" description="Battery health appears once telemetry is available." />
      </>
    );
  }

  const avgHealth = withT.reduce((a, x) => a + x.t!.batteryHealth, 0) / withT.length;
  const avgLevel = withT.reduce((a, x) => a + x.t!.batteryLevel, 0) / withT.length;
  const degraded = withT.filter((x) => x.t!.batteryHealth < 85).length;

  return (
    <>
      <PageHeader title="Battery Health" description="State of charge and long-term state of health." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Avg state of charge" value={`${formatNumber(avgLevel)}%`} accent="green" />
        <StatCard label="Avg state of health" value={`${formatNumber(avgHealth)}%`} />
        <StatCard label="Needs attention" value={degraded} accent={degraded ? "amber" : "green"} hint="health < 85%" />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold">Per-vehicle battery health</h2>
        <div className="space-y-4">
          {withT.map(({ vehicle, t }) => (
            <div key={vehicle.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <Link href={`/vehicles/${vehicle.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                  {vehicle.name}
                </Link>
                <span className="text-slate-500">
                  SoH {formatNumber(t!.batteryHealth)}% · SoC {formatNumber(t!.batteryLevel)}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${healthTone(t!.batteryHealth)}`}
                  style={{ width: `${t!.batteryHealth}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
