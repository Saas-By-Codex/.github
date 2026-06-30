import { Role } from "@prisma/client";

/**
 * Role-based access control.
 *
 * Roles are ordered by privilege. A permission check passes when the member's
 * role rank is >= the required rank. Keep this the single source of truth for
 * authorization so route handlers never hard-code role strings.
 */
const RANK: Record<Role, number> = {
  VIEWER: 0,
  MANAGER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export type Permission =
  | "fleet:read"
  | "fleet:write"
  | "integration:manage"
  | "member:manage"
  | "billing:manage"
  | "audit:read"
  | "org:admin";

// Minimum role required for each permission.
const REQUIRED: Record<Permission, Role> = {
  "fleet:read": Role.VIEWER,
  "fleet:write": Role.MANAGER,
  "integration:manage": Role.ADMIN,
  "member:manage": Role.ADMIN,
  "billing:manage": Role.OWNER,
  "audit:read": Role.ADMIN,
  "org:admin": Role.ADMIN,
};

export function can(role: Role, permission: Permission): boolean {
  return RANK[role] >= RANK[REQUIRED[permission]];
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(permission);
  }
}

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`Missing required permission: ${permission}`);
    this.name = "ForbiddenError";
  }
}
