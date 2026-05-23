import { PERMISSIONS } from '@/lib/permissions';

export interface RoutePermission {
  permission?: string;
  roles?: string[];
  requireAuth?: boolean;
}

export const routePermissions: Record<string, RoutePermission> = {
  // Admin routes
  '/admin': { permission: PERMISSIONS.ADMIN_SETTINGS },
  '/admin/users': { permission: PERMISSIONS.USERS_READ },
  '/admin/bans': { permission: PERMISSIONS.BANS_VIEW },
  '/admin/audit-log': { permission: PERMISSIONS.AUDIT_VIEW },
  '/admin/impersonate': { permission: PERMISSIONS.ADMIN_IMPERSONATE },
  '/admin/restore': { permission: PERMISSIONS.RESTORE_ACCOUNTS },
  '/admin/moderation': { permission: PERMISSIONS.MODERATION_REPORTS },
  '/admin/webhooks': { permission: PERMISSIONS.WEBHOOKS_MANAGE },
  '/admin/news': { permission: PERMISSIONS.NEWS_EDIT },
  '/admin/csp-reports': { permission: PERMISSIONS.CSP_VIEW },
  '/admin/ai-dashboard': { permission: PERMISSIONS.ADMIN_SETTINGS },
  '/admin/analytics/realtime': { permission: PERMISSIONS.ANALYTICS_VIEW },
  '/admin/settings': { permission: PERMISSIONS.ADMIN_SETTINGS },
  '/admin/manga': { permission: PERMISSIONS.MANGA_EDIT },

  // Creator routes
  '/creator/dashboard': { permission: PERMISSIONS.MANGA_CREATE },
  '/creator/upload': { permission: PERMISSIONS.CHAPTERS_CREATE },

  // Protected routes
  '/settings': { requireAuth: true },
  '/profile': { requireAuth: true },
  '/library': { requireAuth: true },
  '/feed': { requireAuth: true },
  '/achievements': { requireAuth: true },
  '/bookmarks': { requireAuth: true },
  '/collections': { requireAuth: true },
  '/comments': { requireAuth: true },
  '/following': { requireAuth: true },
  '/messages': { requireAuth: true },
  '/quests': { requireAuth: true },
  '/reading-history': { requireAuth: true },
  '/transactions': { requireAuth: true },
  '/checkout': { requireAuth: true },
};

export function getRoutePermission(path: string): RoutePermission | null {
  const exact = routePermissions[path];
  if (exact) return exact;

  const prefix = Object.keys(routePermissions)
    .filter((key) => key.endsWith('/'))
    .sort((a, b) => b.length - a.length)
    .find((key) => path.startsWith(key));

  if (prefix) return routePermissions[prefix];

  return null;
}
