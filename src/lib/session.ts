import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

export interface ActiveContext {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: Role;
}

/**
 * Resolve the authenticated user and their active organization membership.
 *
 * For the MVP a user's "active" org is their first membership. A real product
 * would persist an org switcher selection; the resolution is centralized here
 * so that change touches one function.
 *
 * Returns null when unauthenticated or not yet onboarded into an org.
 */
export async function getActiveContext(): Promise<ActiveContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { organization: true },
  });
  if (!membership) return null;

  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    role: membership.role,
  };
}

/** Throwing variant for use in route handlers and server actions. */
export async function requireContext(): Promise<ActiveContext> {
  const ctx = await getActiveContext();
  if (!ctx) throw new Error("UNAUTHENTICATED");
  return ctx;
}
