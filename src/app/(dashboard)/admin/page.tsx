import { requireContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Card, EmptyState, PageHeader, StatCard, Badge } from "@/components/ui";
import { RoleSelect } from "@/components/role-select";
import { formatDateTime } from "@/lib/utils";

export default async function AdminPage() {
  const ctx = await requireContext();

  if (!can(ctx.role, "org:admin")) {
    return (
      <>
        <PageHeader title="Admin" />
        <EmptyState icon="🛡️" title="Admin access required" description="Ask an organization owner or admin to grant you access." />
      </>
    );
  }

  const [members, auditLogs, counts] = await Promise.all([
    prisma.teamMember.findMany({
      where: { organizationId: ctx.organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: ctx.organizationId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.$transaction([
      prisma.vehicle.count({ where: { organizationId: ctx.organizationId } }),
      prisma.integrationAccount.count({ where: { organizationId: ctx.organizationId, status: "CONNECTED" } }),
      prisma.auditLog.count({ where: { organizationId: ctx.organizationId } }),
    ]),
  ]);

  const canManageMembers = can(ctx.role, "member:manage");

  return (
    <>
      <PageHeader title="Admin" description="Team management and audit trail." />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Members" value={members.length} />
        <StatCard label="Vehicles" value={counts[0]} />
        <StatCard label="Connected integrations" value={counts[1]} />
        <StatCard label="Audit events" value={counts[2]} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold">Team & roles</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-500">
            <tr>
              <th className="py-2 font-medium">Member</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Joined</th>
              <th className="py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="py-2.5 font-medium text-slate-800">{m.user.name ?? "—"}</td>
                <td className="py-2.5 text-slate-600">{m.user.email}</td>
                <td className="py-2.5 text-slate-500">{formatDateTime(m.createdAt)}</td>
                <td className="py-2.5">
                  {canManageMembers && m.userId !== ctx.userId ? (
                    <RoleSelect memberId={m.id} role={m.role} />
                  ) : (
                    <Badge tone="slate">{m.role}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold">Audit log</h2>
        {auditLogs.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No audit events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="py-2 font-medium">When</th>
                  <th className="py-2 font-medium">Actor</th>
                  <th className="py-2 font-medium">Action</th>
                  <th className="py-2 font-medium">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 text-slate-500">{formatDateTime(log.createdAt)}</td>
                    <td className="py-2 text-slate-600">{log.user?.email ?? "system"}</td>
                    <td className="py-2"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{log.action}</code></td>
                    <td className="py-2 text-slate-500">{log.targetType ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
