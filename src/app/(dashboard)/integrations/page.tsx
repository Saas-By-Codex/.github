import { requireContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { listAdapters } from "@/integrations/adapters";
import { can } from "@/lib/rbac";
import { Card, PageHeader, Badge } from "@/components/ui";
import { ConnectButton } from "@/components/integration-actions";
import { formatDateTime } from "@/lib/utils";

export default async function IntegrationsPage() {
  const ctx = await requireContext();
  const accounts = await prisma.integrationAccount.findMany({
    where: { organizationId: ctx.organizationId },
  });
  const byProvider = new Map(accounts.map((a) => [a.provider, a]));
  const adapters = listAdapters();
  const canManage = can(ctx.role, "integration:manage");

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect official manufacturer APIs and approved telematics providers."
      />

      <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
        🔒 EVFleetIQ only reads authorized data. Connecting grants <strong>read-only</strong> access via
        the provider&apos;s official OAuth flow. Tokens are encrypted at rest and never displayed.
        {!canManage && <div className="mt-1 text-brand-700">You need Admin access to manage integrations.</div>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adapters.map((adapter) => {
          const account = byProvider.get(adapter.provider);
          const connected = account?.status === "CONNECTED";
          return (
            <Card key={adapter.provider} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{adapter.displayName}</h3>
                  <Badge tone={connected ? "green" : "slate"}>
                    {connected ? "Connected" : "Not connected"}
                  </Badge>
                </div>
                <span className="text-2xl">🔗</span>
              </div>
              <div className="text-xs text-slate-500">
                <div className="font-medium text-slate-600">Requested scopes (read-only):</div>
                <ul className="mt-1 space-y-0.5">
                  {adapter.requestedScopes.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </div>
              {account?.lastSyncedAt && (
                <div className="text-xs text-slate-400">Last synced {formatDateTime(account.lastSyncedAt)}</div>
              )}
              {canManage && (
                <div className="mt-auto pt-2">
                  <ConnectButton provider={adapter.provider} connected={connected} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
