import Link from "next/link";
import { requireContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui";
import { AddVehicleButton, SeedDemoButton } from "@/components/vehicle-actions";
import { formatNumber } from "@/lib/utils";

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "slate" | "blue"> = {
  ACTIVE: "green",
  CHARGING: "blue",
  IDLE: "slate",
  MAINTENANCE: "amber",
  OFFLINE: "red",
};

export default async function VehiclesPage() {
  const ctx = await requireContext();
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      assignedDriver: true,
      telemetry: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
  });

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Every EV in your fleet."
        action={
          <div className="flex gap-2">
            <SeedDemoButton />
            <AddVehicleButton />
          </div>
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState
          icon="🚗"
          title="No vehicles yet"
          description="Add a vehicle manually, connect an integration, or load demo data to explore the platform."
          action={<AddVehicleButton />}
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Vehicle</th>
                <th className="px-5 py-3 font-medium">Provider</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Battery</th>
                <th className="px-5 py-3 font-medium">Range</th>
                <th className="px-5 py-3 font-medium">Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map((v) => {
                const t = v.telemetry[0];
                return (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/vehicles/${v.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                        {v.name}
                      </Link>
                      <div className="text-xs text-slate-400">{v.make} {v.model}{v.year ? ` · ${v.year}` : ""}</div>
                    </td>
                    <td className="px-5 py-3"><Badge tone="slate">{v.provider}</Badge></td>
                    <td className="px-5 py-3"><Badge tone={STATUS_TONE[v.status]}>{v.status}</Badge></td>
                    <td className="px-5 py-3">{t ? `${formatNumber(t.batteryLevel)}%` : "—"}</td>
                    <td className="px-5 py-3">{t ? `${formatNumber(t.rangeKm)} km` : "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{v.assignedDriver?.name ?? "Unassigned"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
