import { withApi, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";
import { VehicleProvider } from "@prisma/client";

// DELETE /api/integrations/:provider — disconnect and purge stored tokens.
export async function DELETE(
  req: Request,
  { params }: { params: { provider: string } },
) {
  return withApi(req, async (ctx) => {
    assertCan(ctx.role, "integration:manage");

    const provider = params.provider as VehicleProvider;
    if (!Object.values(VehicleProvider).includes(provider)) {
      return json({ error: "Unknown provider" }, 400);
    }

    const existing = await prisma.integrationAccount.findUnique({
      where: {
        organizationId_provider: { organizationId: ctx.organizationId, provider },
      },
    });
    if (!existing) return json({ error: "Not found" }, 404);

    // Clear encrypted tokens and mark disconnected (retain row for audit).
    await prisma.integrationAccount.update({
      where: { id: existing.id },
      data: {
        status: "DISCONNECTED",
        accessTokenEnc: null,
        refreshTokenEnc: null,
        tokenExpiresAt: null,
      },
    });

    await recordAudit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "integration.disconnect",
      targetType: "IntegrationAccount",
      targetId: existing.id,
      metadata: { provider },
    });

    return json({ ok: true });
  });
}
