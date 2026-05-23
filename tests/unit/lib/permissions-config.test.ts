import { describe, it, expect } from 'vitest';

import { getRoutePermission } from '@/lib/permissions-config';

describe('permissions-config', () => {
  describe('getRoutePermission', () => {
    it('returns exact match for /admin', () => {
      const result = getRoutePermission('/admin');
      expect(result).toEqual({ permission: 'admin:settings' });
    });

    it('returns exact match for /admin/users', () => {
      const result = getRoutePermission('/admin/users');
      expect(result).toEqual({ permission: 'users:read' });
    });

    it('returns exact match for /admin/bans', () => {
      const result = getRoutePermission('/admin/bans');
      expect(result).toEqual({ permission: 'bans:view' });
    });

    it('returns exact match for /settings', () => {
      const result = getRoutePermission('/settings');
      expect(result).toEqual({ requireAuth: true });
    });

    it('returns exact match for /profile', () => {
      const result = getRoutePermission('/profile');
      expect(result).toEqual({ requireAuth: true });
    });

    it('returns null for an unmatched route', () => {
      const result = getRoutePermission('/nonexistent');
      expect(result).toBeNull();
    });

    it('returns null for unmatched nested path', () => {
      const result = getRoutePermission('/admin/users/123');
      expect(result).toBeNull();
    });

    it('returns correct permission for /admin/audit-log', () => {
      const result = getRoutePermission('/admin/audit-log');
      expect(result).toEqual({ permission: 'audit:view' });
    });

    it('returns correct permission for /creator/dashboard', () => {
      const result = getRoutePermission('/creator/dashboard');
      expect(result).toEqual({ permission: 'manga:create' });
    });

    it('returns requireAuth for /library', () => {
      const result = getRoutePermission('/library');
      expect(result).toEqual({ requireAuth: true });
    });
  });
});
