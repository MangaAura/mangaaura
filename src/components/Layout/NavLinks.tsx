'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import {
  BookOpen, Compass, Trophy, MessageCircle, Users, Library, Shield,
  Bell, Plus, Rss, Calendar, FolderOpen, Settings, Sparkles, Search, Target,
  Coins,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { useT } from '@/i18n';

export interface NavLinkDef {
  name: string;
  path: string;
  iconName: string;
  i18nKey: string;
  hideWhenLoggedOut?: boolean;
  requiresModerator?: boolean;
}

export const ALL_NAV_LINKS: NavLinkDef[] = [
  { name: 'Inicio', path: '/', iconName: 'BookOpen', i18nKey: 'nav.home' },
  { name: 'Explorar', path: '/explore', iconName: 'Compass', i18nKey: 'nav.explore' },
  { name: 'Rankings', path: '/rankings', iconName: 'Trophy', i18nKey: 'nav.rankings' },
  { name: 'Misiones', path: '/quests', iconName: 'Target', i18nKey: 'nav.quests' },
  { name: 'Foro', path: '/community/forum', iconName: 'MessageCircle', i18nKey: 'nav.forum' },
  { name: 'Comunidad', path: '/community', iconName: 'Users', i18nKey: 'nav.community' },
  { name: 'Biblioteca', path: '/library', iconName: 'Library', i18nKey: 'nav.library', hideWhenLoggedOut: true },
  { name: 'Crear manga', path: '/creator/manga/new', iconName: 'Plus', i18nKey: 'creator.newManga', hideWhenLoggedOut: true },
  { name: 'Admin', path: '/admin', iconName: 'Shield', i18nKey: 'nav.admin', requiresModerator: true },
];

export const MAIN_NAV_LINKS: NavLinkDef[] = [
  { name: 'Inicio', path: '/', iconName: 'BookOpen', i18nKey: 'nav.home' },
  { name: 'Explorar', path: '/explore', iconName: 'Compass', i18nKey: 'nav.explore' },
  { name: 'Rankings', path: '/rankings', iconName: 'Trophy', i18nKey: 'nav.rankings' },
];

export const MORE_NAV_LINKS: NavLinkDef[] = [
  { name: 'Economía', path: '/economy', iconName: 'Coins', i18nKey: 'nav.economy', hideWhenLoggedOut: true },
  { name: 'Misiones', path: '/quests', iconName: 'Target', i18nKey: 'nav.quests' },
  { name: 'Foro', path: '/community/forum', iconName: 'MessageCircle', i18nKey: 'nav.forum' },
  { name: 'Comunidad', path: '/community', iconName: 'Users', i18nKey: 'nav.community' },
  { name: 'Crear manga', path: '/creator/manga/new', iconName: 'Plus', i18nKey: 'creator.newManga', hideWhenLoggedOut: true },
  { name: 'Biblioteca', path: '/library', iconName: 'Library', i18nKey: 'nav.library', hideWhenLoggedOut: true },
  { name: 'Admin', path: '/admin', iconName: 'Shield', i18nKey: 'nav.admin', requiresModerator: true },
];

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Compass, Trophy, Users, Library, Shield, Bell,
  MessageCircle, Plus, Rss, Calendar, FolderOpen, Settings, Sparkles, Search, Target,
  Coins,
};

/** Strip locale prefix from a pathname */
export function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(es|en)(\/|$)/, '/') || '/';
}

/** Get locale from a pathname */
export function getLocaleFromPath(pathname: string): string {
  const match = pathname.match(/^\/(es|en)(\/|$)/);
  return match ? match[1] : 'es';
}

/** Prepend locale prefix to path */
export function localeHref(pathname: string, target: string): string {
  const locale = getLocaleFromPath(pathname);
  return `/${locale}${target === '/' ? '' : target}`;
}

export function getIcon(name: string) {
  return iconComponents[name];
}

export function isActive(pathname: string | null, path: string): boolean {
  if (!pathname) return false;
  // Strip locale prefix from pathname for comparison
  const cleanPathname = pathname.replace(/^\/(es|en)(\/|$)/, '/') || '/';
  if (path === '/') return cleanPathname === '/';
  const overriddenByMoreSpecific = ALL_NAV_LINKS.some(
    (other) =>
      other.path !== path &&
      other.path.startsWith(`${path}/`) &&
      (cleanPathname === other.path || cleanPathname.startsWith(`${other.path}/`))
  );
  if (overriddenByMoreSpecific) return false;
  return cleanPathname === path || cleanPathname.startsWith(`${path}/`);
}

const navLinkVariants = cva(
  'flex items-center gap-2 font-medium transition-all duration-200 relative',
  {
    variants: {
      active: {
        true: 'text-[var(--primary)] bg-[var(--primary-subtle)]',
        false: 'text-[var(--text-secondary)]',
      },
      mobile: {
        true: 'px-3 py-2.5 rounded-lg text-sm',
        false: 'px-3 py-2 rounded-lg text-sm',
      },
    },
    compoundVariants: [
      { active: false, mobile: false, className: 'hover:text-[var(--text-primary)] hover:bg-[var(--surface)]' },
      { active: true, mobile: false, className: 'shadow-sm' },
      { active: false, mobile: true, className: 'hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]' },
    ],
    defaultVariants: { active: false, mobile: false },
  }
);

type NavLinkVariants = VariantProps<typeof navLinkVariants>;

interface NavLinksProps extends NavLinkVariants {
  links: NavLinkDef[];
  mounted?: boolean;
}

export function NavLinks({ links, mobile, mounted = true }: NavLinksProps) {
  const pathname = usePathname();
  const t = useT();

  return (
    <>
      {links.map((link) => {
        const Icon = getIcon(link.iconName);
        const active = isActive(pathname, link.path);
        return (
          <Link
            key={link.path}
            href={localeHref(pathname, link.path)}
            className={navLinkVariants({ active, mobile })}
            aria-current={active ? 'page' : undefined}
          >
      {mounted && Icon ? (
            <Icon className={mobile ? 'w-5 h-5' : 'w-4 h-4'} aria-hidden="true" />
          ) : (
            <span className={mobile ? 'w-5 h-5' : 'w-4 h-4'} aria-hidden="true" />
            )}
            {t(link.i18nKey)}
          </Link>
        );
      })}
    </>
  );
}
