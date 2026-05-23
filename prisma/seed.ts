import { prisma } from '../src/lib/prisma';

const ROLES = [
  { name: 'OWNER', description: 'Full system access', priority: 100, isSystem: true },
  { name: 'ADMIN', description: 'Administrative access', priority: 90, isSystem: true },
  { name: 'MODERATOR', description: 'Content moderation', priority: 70, isSystem: true },
  { name: 'EDITOR', description: 'Manga and chapter management', priority: 50, isSystem: true },
  { name: 'PREMIUM', description: 'Premium subscriber', priority: 30, isSystem: true },
  { name: 'USER', description: 'Regular user', priority: 10, isSystem: true },
];

const PERMISSIONS = [
  { codename: 'users:read', description: 'View users', module: 'users' },
  { codename: 'users:write', description: 'Edit users', module: 'users' },
  { codename: 'users:ban', description: 'Ban users', module: 'users' },
  { codename: 'users:delete', description: 'Delete users', module: 'users' },
  { codename: 'users:edit_role', description: 'Change user roles', module: 'users' },

  { codename: 'manga:create', description: 'Create manga series', module: 'manga' },
  { codename: 'manga:edit', description: 'Edit manga series', module: 'manga' },
  { codename: 'manga:delete', description: 'Delete manga series', module: 'manga' },
  { codename: 'manga:publish', description: 'Publish/unpublish manga', module: 'manga' },

  { codename: 'chapters:create', description: 'Create chapters', module: 'chapters' },
  { codename: 'chapters:edit', description: 'Edit chapters', module: 'chapters' },
  { codename: 'chapters:delete', description: 'Delete chapters', module: 'chapters' },
  { codename: 'chapters:schedule', description: 'Schedule chapter publishing', module: 'chapters' },

  { codename: 'comments:moderate', description: 'Moderate comments', module: 'comments' },
  { codename: 'comments:delete', description: 'Delete comments', module: 'comments' },

  { codename: 'moderation:reports', description: 'View reports', module: 'moderation' },
  { codename: 'moderation:resolve', description: 'Resolve reports', module: 'moderation' },

  { codename: 'admin:settings', description: 'Change site settings', module: 'admin' },
  { codename: 'admin:logs', description: 'View admin logs', module: 'admin' },
  { codename: 'admin:impersonate', description: 'Impersonate users', module: 'admin' },

  { codename: 'economy:adjust', description: 'Adjust user balances', module: 'economy' },
  { codename: 'economy:rewards', description: 'Grant rewards', module: 'economy' },

  { codename: 'news:create', description: 'Create news articles', module: 'news' },
  { codename: 'news:edit', description: 'Edit news articles', module: 'news' },
  { codename: 'news:delete', description: 'Delete news articles', module: 'news' },

  { codename: 'webhooks:manage', description: 'Manage webhooks', module: 'webhooks' },
  { codename: 'analytics:view', description: 'View analytics', module: 'analytics' },
  { codename: 'csp:view', description: 'View CSP reports', module: 'csp' },

  { codename: 'bans:create', description: 'Create bans', module: 'bans' },
  { codename: 'bans:lift', description: 'Lift bans', module: 'bans' },
  { codename: 'bans:view', description: 'View ban records', module: 'bans' },

  { codename: 'audit:view', description: 'View audit logs', module: 'audit' },
  { codename: 'restore:accounts', description: 'Restore deleted accounts', module: 'restore' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: PERMISSIONS.map((p) => p.codename),
  ADMIN: PERMISSIONS.map((p) => p.codename).filter(
    (p) => p !== 'admin:impersonate'
  ),
  MODERATOR: [
    'users:read',
    'comments:moderate',
    'comments:delete',
    'moderation:reports',
    'moderation:resolve',
    'bans:view',
    'audit:view',
  ],
  EDITOR: [
    'manga:create',
    'manga:edit',
    'manga:publish',
    'chapters:create',
    'chapters:edit',
    'chapters:delete',
    'chapters:schedule',
    'news:create',
    'news:edit',
  ],
  PREMIUM: [],
  USER: [],
};

async function main() {
  console.log('Seeding roles...');
  const roleRecords: Record<string, string> = {};

  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      create: roleData,
      update: roleData,
    });
    roleRecords[role.name] = role.id;
  }

  console.log('Seeding permissions...');
  const permissionRecords: Record<string, string> = {};

  for (const permData of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { codename: permData.codename },
      create: permData,
      update: permData,
    });
    permissionRecords[perm.codename] = perm.id;
  }

  console.log('Seeding role-permission assignments...');
  for (const [roleName, permCodenames] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleRecords[roleName];
    if (!roleId) continue;

    for (const codename of permCodenames) {
      const permId = permissionRecords[codename];
      if (!permId) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permId } },
        create: { roleId, permissionId: permId },
        update: {},
      });
    }
  }

  console.log('Assigning default USER role to existing users...');
  const userRoleId = roleRecords['USER'];
  if (userRoleId) {
    const users = await prisma.user.findMany();
    for (const user of users) {
      const existingRoles = await prisma.userRole.findMany({
        where: { userId: user.id },
      });

      if (existingRoles.length === 0) {
        const roleName = user.role;
        const targetRoleId = roleRecords[roleName] || userRoleId;
        await prisma.userRole.create({
          data: { userId: user.id, roleId: targetRoleId },
        });
      }
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
