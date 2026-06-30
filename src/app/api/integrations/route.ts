import { withApi, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { connectIntegrationSchema } from "@/lib/validation";
import { encryptToken } from "@/lib/crypto";
import { getAdapter, type ConnectableProvider } from "@/integrations/adapters";
import { recordAudit } from "@/lib/audit";

// POST /api/integrations — connect (or re-connect) a provider for the org.
// Tokens are ENCRYPTED before persistence; plaintext never touches the DB.
export async function POST(req: Request) {
  return withApi(req, async (ctx) => {
    assertCan(ctx.role, "integration:manage");
    const body = await req.json();
    const data = connectIntegrationSchema.parse(body);

    const adapter = getAdapter(data.provider as ConnectableProvider);
    const ok = await adapter.verify({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      scopes: data.scopes,
    });
    if (!ok) return json({ error: "Provider verification failed" }, 400);

    const account = await prisma.integrationAccount.upsert({
      where: {
        organizationId_provider: {
          organizationId: ctx.organizationId,
          provider: data.provider,
        },
      },
      create: {
        organizationId: ctx.organizationId,
        provider: data.provider,
        status: "CONNECTED",
        accessTokenEnc: encryptToken(data.accessToken),
        refreshTokenEnc: data.refreshToken ? encryptToken(data.refreshToken) : null,
        scopes: data.scopes,
        lastSyncedAt: new Date(),
      },
      update: {
        status: "CONNECTED",
        accessTokenEnc: encryptToken(data.accessToken),
        refreshTokenEnc: data.refreshToken ? encryptToken(data.refreshToken) : null,
        scopes: data.scopes,
        lastSyncedAt: new Date(),
      },
    });

    await recordAudit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "integration.connect",
      targetType: "IntegrationAccount",
      targetId: account.id,
      // NOTE: never log the token itself.
      metadata: { provider: data.provider },
      ipAddress: req.headers.get("x-forwarded-for"),
    });

    // Return a safe view (no token material).
    return json({
      integration: {
        id: account.id,
        provider: account.provider,
        status: account.status,
        lastSyncedAt: account.lastSyncedAt,
      },
    });
  });
}
