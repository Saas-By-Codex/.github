import { withApi, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { alertStatusSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

// PATCH /api/alerts/:id — acknowledge or resolve a maintenance alert.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return withApi(req, async (ctx) => {
    assertCan(ctx.role, "fleet:write");
    const body = await req.json();
    const { status } = alertStatusSchema.parse(body);

    // Ensure the alert belongs to the caller's org before mutating.
    const existing = await prisma.maintenanceAlert.findFirst({
      where: { id: params.id, vehicle: { organizationId: ctx.organizationId } },
    });
    if (!existing) return json({ error: "Not found" }, 404);

    const alert = await prisma.maintenanceAlert.update({
      where: { id: params.id },
      data: {
        status,
        resolvedAt: status === "RESOLVED" ? new Date() : null,
      },
    });

    await recordAudit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "alert.status_change",
      targetType: "MaintenanceAlert",
      targetId: alert.id,
      metadata: { status },
    });

    return json({ alert });
  });
}
