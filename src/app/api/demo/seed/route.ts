import { withApi, json } from "@/lib/api";
import { assertCan } from "@/lib/rbac";
import { seedOrganizationDemoData } from "@/lib/demo-data";
import { recordAudit } from "@/lib/audit";

// POST /api/demo/seed — load a sample fleet into the active org (Manager+).
export async function POST(req: Request) {
  return withApi(
    req,
    async (ctx) => {
      assertCan(ctx.role, "fleet:write");
      const result = await seedOrganizationDemoData(ctx.organizationId);
      if (result.created) {
        await recordAudit({
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          action: "demo.seed",
          metadata: { source: "in-app" },
        });
      }
      return json(result);
    },
    { limit: 5 },
  );
}
