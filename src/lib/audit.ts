import { prisma } from "@/lib/db";

/**
 * Append an entry to the immutable audit log. Call this for every sensitive
 * action (vehicle/member/integration/billing changes). Never include secrets
 * (tokens, passwords) in `metadata`.
 */
export async function recordAudit(params: {
  organizationId: string;
  userId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    // Auditing must never break the primary action; log and continue.
    console.error("Failed to write audit log", err);
  }
}
