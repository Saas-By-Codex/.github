import { withApi, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { updateMemberRoleSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

// PATCH /api/members/role — change a member's role (Admin+).
export async function PATCH(req: Request) {
  return withApi(req, async (ctx) => {
    assertCan(ctx.role, "member:manage");
    const body = await req.json();
    const { memberId, role } = updateMemberRoleSchema.parse(body);

    // Member must belong to the caller's org.
    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, organizationId: ctx.organizationId },
    });
    if (!member) return json({ error: "Not found" }, 404);

    // Safety: never allow removing the last OWNER.
    if (member.role === "OWNER" && role !== "OWNER") {
      const owners = await prisma.teamMember.count({
        where: { organizationId: ctx.organizationId, role: "OWNER" },
      });
      if (owners <= 1) {
        return json({ error: "Cannot demote the only owner" }, 400);
      }
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
    });

    await recordAudit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "member.role_change",
      targetType: "TeamMember",
      targetId: memberId,
      metadata: { from: member.role, to: role },
    });

    return json({ member: { id: updated.id, role: updated.role } });
  });
}
