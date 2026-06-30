import { revalidatePath } from "next/cache";
import { requireContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { assertCan, can } from "@/lib/rbac";
import { orgSettingsSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { Card, PageHeader, Badge } from "@/components/ui";

export default async function SettingsPage() {
  const ctx = await requireContext();
  const [org, members, subscription] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } }),
    prisma.teamMember.findMany({
      where: { organizationId: ctx.organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.subscription.findUnique({ where: { organizationId: ctx.organizationId } }),
  ]);

  const canManage = can(ctx.role, "org:admin");

  async function saveSettings(formData: FormData) {
    "use server";
    const c = await requireContext();
    assertCan(c.role, "org:admin");
    const parsed = orgSettingsSchema.parse({
      electricityPricePerKwh: formData.get("electricityPricePerKwh"),
      gridCo2PerKwh: formData.get("gridCo2PerKwh"),
      currency: formData.get("currency"),
    });
    await prisma.organization.update({
      where: { id: c.organizationId },
      data: parsed,
    });
    await recordAudit({
      organizationId: c.organizationId,
      userId: c.userId,
      action: "organization.settings_update",
      targetType: "Organization",
      targetId: c.organizationId,
      metadata: parsed,
    });
    revalidatePath("/settings");
  }

  return (
    <>
      <PageHeader title="Settings" description="Organization configuration and team." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Cost & carbon factors</h2>
          <form action={saveSettings} className="space-y-4">
            <div>
              <label className="label">Electricity price (per kWh)</label>
              <input name="electricityPricePerKwh" type="number" step="0.001" defaultValue={org.electricityPricePerKwh} className="input" disabled={!canManage} />
            </div>
            <div>
              <label className="label">Grid emission factor (kg CO₂ / kWh)</label>
              <input name="gridCo2PerKwh" type="number" step="0.001" defaultValue={org.gridCo2PerKwh} className="input" disabled={!canManage} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select name="currency" defaultValue={org.currency} className="input" disabled={!canManage}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
            {canManage ? (
              <button type="submit" className="btn-primary">Save changes</button>
            ) : (
              <p className="text-sm text-slate-400">Admin access required to edit.</p>
            )}
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-semibold">Subscription</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Plan</span>
              <Badge tone="blue">{subscription?.plan ?? "FREE"}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <Badge tone={subscription?.status === "ACTIVE" ? "green" : "amber"}>{subscription?.status ?? "TRIALING"}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Seats</span>
              <span className="font-medium">{subscription?.seats ?? 3}</span>
            </div>
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              Billing is Stripe-ready. Set <code>STRIPE_SECRET_KEY</code> and create a checkout session via
              <code> /api/billing/checkout</code> to enable paid plans.
            </p>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold">Team members</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-medium text-slate-800">{m.user.name ?? m.user.email}</div>
                    <div className="text-xs text-slate-400">{m.user.email}</div>
                  </div>
                  <Badge tone="slate">{m.role}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400">Manage roles from the Admin page.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
