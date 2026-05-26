import { describe, it, expect, vi } from 'vitest';

const mockUserRoleFindMany = vi.hoisted(() => vi.fn());
const mockRoleFindUnique = vi.hoisted(() => vi.fn());
const mockUserRoleUpsert = vi.hoisted(() => vi.fn());
const mockUserRoleDeleteMany = vi.hoisted(() => vi.fn());
const mockUserFindUnique = vi.hoisted(() => vi.fn());

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userRole: {
      findMany: mockUserRoleFindMany,
      upsert: mockUserRoleUpsert,
      deleteMany: mockUserRoleDeleteMany,
    },
    role: {
      findUnique: mockRoleFindUnique,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
  },
}));

import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserRoles,
  assignRole,
  removeRole,
  getPrimaryRole,
  getUserHighestRole,
} from '@/lib/permissions';

describe('permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasPermission', () => {
    it('returns true when user has the permission', async () => {
      mockUserRoleFindMany.mockResolvedValue([
        {
          role: {
            permissions: [
              { permission: { codename: 'users:read' } },
              { permission: { codename: 'users:write' } },
            ],
          },
        },
      ]);

      const result = await hasPermission('user-1', 'users:read');
      expect(result).toBe(true);
    });

    it('returns false when user lacks the permission', async () => {
      mockUserRoleFindMany.mockResolvedValue([
        {
          role: {
            permissions: [{ permission: { codename: 'users:read' } }],
          },
        },
      ]);

      const result = await hasPermission('user-1', 'users:write');
      expect(result).toBe(false);
    });

    it('returns false when user has no roles', async () => {
      mockUserRoleFindMany.mockResolvedValue([]);

      const result = await hasPermission('user-1', 'users:read');
      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when user has at least one of the permissions', async () => {
      mockUserRoleFindMany.mockResolvedValue([
        {
          role: {
            permissions: [{ permission: { codename: 'users:read' } }],
          },
        },
      ]);

      const result = await hasAnyPermission('user-1', ['users:read', 'users:write']);
      expect(result).toBe(true);
    });

    it('returns false when user has none of the permissions', async () => {
      mockUserRoleFindMany.mockResolvedValue([
        {
          role: {
            permissions: [{ permission: { codename: 'comments:moderate' } }],
          },
        },
      ]);

      const result = await hasAnyPermission('user-1', ['users:read', 'users:write']);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true when user has all permissions', async () => {
      mockUserRoleFindMany.mockResolvedValue([
        {
          role: {
            permissions: [
              { permission: { codename: 'users:read' } },
              { permission: { codename: 'users:write' } },
              { permission: { codename: 'users:ban' } },
            ],
          },
        },
      ]);

      const result = await hasAllPermissions('user-1', ['users:read', 'users:write']);
      expect(result).toBe(true);
    });

    it('returns false when user lacks any of the permissions', async () => {
      mockUserRoleFindMany.mockResolvedValue([
        {
          role: {
            permissions: [
              { permission: { codename: 'users:read' } },
            ],
          },
        },
      ]);

      const result = await hasAllPermissions('user-1', ['users:read', 'users:write']);
      expect(result).toBe(false);
    });
  });

  describe('getUserRoles', () => {
    it('returns roles sorted by priority descending', async () => {
      mockUserRoleFindMany.mockResolvedValue([
        { role: { id: '1', name: 'USER', priority: 10 } },
        { role: { id: '2', name: 'MOD', priority: 50 } },
        { role: { id: '3', name: 'ADMIN', priority: 100 } },
      ]);

      const roles = await getUserRoles('user-1');
      expect(roles).toHaveLength(3);
      expect(roles[0].name).toBe('ADMIN');
      expect(roles[0].priority).toBe(100);
      expect(roles[1].name).toBe('MOD');
      expect(roles[1].priority).toBe(50);
      expect(roles[2].name).toBe('USER');
      expect(roles[2].priority).toBe(10);
    });

    it('returns empty array when user has no roles', async () => {
      mockUserRoleFindMany.mockResolvedValue([]);

      const roles = await getUserRoles('user-1');
      expect(roles).toEqual([]);
    });
  });

  describe('assignRole', () => {
    it('calls upsert when role exists', async () => {
      mockRoleFindUnique.mockResolvedValue({ id: 'role-1', name: 'MOD' });
      mockUserRoleUpsert.mockResolvedValue({});

      await assignRole('user-1', 'MOD');

      expect(mockRoleFindUnique).toHaveBeenCalledWith({ where: { name: 'MOD' } });
      expect(mockUserRoleUpsert).toHaveBeenCalledWith({
        where: { userId_roleId: { userId: 'user-1', roleId: 'role-1' } },
        create: { userId: 'user-1', roleId: 'role-1' },
        update: {},
      });
    });

    it('throws when role does not exist', async () => {
      mockRoleFindUnique.mockResolvedValue(null);

      await expect(assignRole('user-1', 'NONEXISTENT')).rejects.toThrow("Role 'NONEXISTENT' not found");
    });
  });

  describe('removeRole', () => {
    it('calls deleteMany when role exists', async () => {
      mockRoleFindUnique.mockResolvedValue({ id: 'role-1', name: 'MOD' });
      mockUserRoleDeleteMany.mockResolvedValue({ count: 1 });

      await removeRole('user-1', 'MOD');

      expect(mockRoleFindUnique).toHaveBeenCalledWith({ where: { name: 'MOD' } });
      expect(mockUserRoleDeleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', roleId: 'role-1' },
      });
    });

    it('does nothing when role does not exist', async () => {
      mockRoleFindUnique.mockResolvedValue(null);

      await removeRole('user-1', 'NONEXISTENT');

      expect(mockUserRoleDeleteMany).not.toHaveBeenCalled();
    });
  });

  describe('getPrimaryRole', () => {
    it('returns user role from database', async () => {
      mockUserFindUnique.mockResolvedValue({ role: 'ADMIN' });

      const role = await getPrimaryRole('user-1');
      expect(role).toBe('ADMIN');
    });

    it('returns USER when user not found', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const role = await getPrimaryRole('user-1');
      expect(role).toBe('USER');
    });
  });

  describe('getUserHighestRole', () => {
    it('returns highest priority role', async () => {
      mockUserRoleFindMany.mockResolvedValue([
        { role: { id: '1', name: 'USER', priority: 10 } },
        { role: { id: '2', name: 'ADMIN', priority: 100 } },
      ]);

      const role = await getUserHighestRole('user-1');
      expect(role).toEqual({ id: '2', name: 'ADMIN', priority: 100 });
    });

    it('returns null when user has no roles', async () => {
      mockUserRoleFindMany.mockResolvedValue([]);

      const role = await getUserHighestRole('user-1');
      expect(role).toBeNull();
    });
  });
});
