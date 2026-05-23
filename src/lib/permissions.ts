import { prisma } from '@/lib/prisma';

export type PermissionCodename = string;

export interface PermissionCheck {
  userId: string;
  permission: PermissionCodename;
}

export interface RoleInfo {
  id: string;
  name: string;
  priority: number;
}

let permissionCache: Map<string, string[]> | null = null;
let roleCache: Map<string, RoleInfo> | null = null;

export async function loadPermissions(): Promise<Map<string, string[]>> {
  if (permissionCache) return permissionCache;
  const roles = await prisma.role.findMany({
    include: { permissions: { include: { permission: true } } },
  });
  const cache = new Map<string, string[]>();
  for (const role of roles) {
    cache.set(role.id, role.permissions.map((rp) => rp.permission.codename));
  }
  permissionCache = cache;
  return cache;
}

export async function loadRoles(): Promise<Map<string, RoleInfo>> {
  if (roleCache) return roleCache;
  const roles = await prisma.role.findMany();
  const cache = new Map<string, RoleInfo>();
  for (const role of roles) {
    cache.set(role.id, { id: role.id, name: role.name, priority: role.priority });
  }
  roleCache = cache;
  return cache;
}

export function clearPermissionCache(): void {
  permissionCache = null;
  roleCache = null;
}

async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  const perms = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      perms.add(rp.permission.codename);
    }
  }
  return Array.from(perms);
}

export async function hasPermission(userId: string, permission: PermissionCodename): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

export async function hasAnyPermission(userId: string, permissions: PermissionCodename[]): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return permissions.some((p) => userPerms.includes(p));
}

export async function hasAllPermissions(userId: string, permissions: PermissionCodename[]): Promise<boolean> {
  const userPerms = await getUserPermissions(userId);
  return permissions.every((p) => userPerms.includes(p));
}

export async function getUserRoles(userId: string): Promise<RoleInfo[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles
    .map((ur) => ({ id: ur.role.id, name: ur.role.name, priority: ur.role.priority }))
    .sort((a, b) => b.priority - a.priority);
}

export async function assignRole(userId: string, roleName: string): Promise<void> {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error(`Role '${roleName}' not found`);
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    create: { userId, roleId: role.id },
    update: {},
  });
  clearPermissionCache();
}

export async function removeRole(userId: string, roleName: string): Promise<void> {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return;
  await prisma.userRole.deleteMany({
    where: { userId, roleId: role.id },
  });
  clearPermissionCache();
}

export async function requirePermission(userId: string, permission: PermissionCodename): Promise<void> {
  const has = await hasPermission(userId, permission);
  if (!has) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

export async function getUserHighestRole(userId: string): Promise<RoleInfo | null> {
  const roles = await getUserRoles(userId);
  return roles[0] || null;
}

export async function getPrimaryRole(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role || 'USER';
}

export const PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_BAN: 'users:ban',
  USERS_DELETE: 'users:delete',
  USERS_EDIT_ROLE: 'users:edit_role',

  MANGA_CREATE: 'manga:create',
  MANGA_EDIT: 'manga:edit',
  MANGA_DELETE: 'manga:delete',
  MANGA_PUBLISH: 'manga:publish',

  CHAPTERS_CREATE: 'chapters:create',
  CHAPTERS_EDIT: 'chapters:edit',
  CHAPTERS_DELETE: 'chapters:delete',
  CHAPTERS_SCHEDULE: 'chapters:schedule',

  COMMENTS_MODERATE: 'comments:moderate',
  COMMENTS_DELETE: 'comments:delete',

  MODERATION_REPORTS: 'moderation:reports',
  MODERATION_RESOLVE: 'moderation:resolve',

  ADMIN_SETTINGS: 'admin:settings',
  ADMIN_LOGS: 'admin:logs',
  ADMIN_IMPERSONATE: 'admin:impersonate',

  ECONOMY_ADJUST: 'economy:adjust',
  ECONOMY_REWARDS: 'economy:rewards',

  NEWS_CREATE: 'news:create',
  NEWS_EDIT: 'news:edit',
  NEWS_DELETE: 'news:delete',

  WEBHOOKS_MANAGE: 'webhooks:manage',
  ANALYTICS_VIEW: 'analytics:view',
  CSP_VIEW: 'csp:view',

  BANS_CREATE: 'bans:create',
  BANS_LIFT: 'bans:lift',
  BANS_VIEW: 'bans:view',

  AUDIT_VIEW: 'audit:view',

  RESTORE_ACCOUNTS: 'restore:accounts',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
