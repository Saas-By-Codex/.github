import { requireContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, EmptyState, PageHeader, StatCard, Badge } from "@/components/ui";
import { AlertActions } from "@/components/alert-actions";
import { formatDateTime } from "@/lib/utils";

export default async function MaintenancePage() {
  const ctx = await requireContext();
  const alerts = await prisma.maintenanceAlert.findMany({
    where: { vehicle: { organizationId: ctx.organizationId } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { vehicle: true },
  });

  const open = alerts.filter((a) => a.status === "OPEN").length;
  const critical = alerts.filter((a) => a.severity === "CRITICAL" && a.status !== "RESOLVED").length;

  return (
    <>
      <PageHeader title="Maintenance Alerts" description="Proactive alerts generated from telemetry rules." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open" value={open} accent={open ? "amber" : "green"} />
        <StatCard label="Critical" value={critical} accent={critical ? "red" : "green"} />
        <StatCard label="Total" value={alerts.length} />
      </div>

      <div className="mt-6">
        {alerts.length === 0 ? (
          <EmptyState icon="🛠️" title="No alerts" description="When telemetry rules trigger (low battery health, high mileage, etc.) alerts will appear here." />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Alert</th>
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Raised</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">{a.title}</div>
                      <div className="text-xs text-slate-400">{a.description}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{a.vehicle.name}</td>
                    <td className="px-5 py-3">
                      <Badge tone={a.severity === "CRITICAL" ? "red" : a.severity === "WARNING" ? "amber" : "slate"}>{a.severity}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={a.status === "RESOLVED" ? "green" : a.status === "ACKNOWLEDGED" ? "blue" : "amber"}>{a.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDateTime(a.createdAt)}</td>
                    <td className="px-5 py-3"><AlertActions alertId={a.id} status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </>
  );
}
