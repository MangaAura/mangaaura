'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Bell, ChevronDown, User, Library, FolderOpen, MessageCircle,
  Rss, Calendar, Sparkles, Shield, Settings, LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

import { NotificationDropdown } from './NotificationDropdown';
import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { useT } from '@/i18n';

interface AuthSectionProps {
  mounted: boolean;
  isLoggedIn: boolean;
  isModerator: boolean;
  session: any;
  userId?: string;
  unreadNotifications: number;
  unreadMessages: number;
}

export function AuthSection({
  mounted,
  isLoggedIn,
  isModerator,
  session,
  unreadNotifications,
}: AuthSectionProps) {
  const pathname = usePathname();
  const t = useT();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname && pathname !== prevPathname) {
    setPrevPathname(pathname);
    setShowNotifMenu(false);
  }

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full bg-[var(--surface)] animate-pulse" />;
  }

  if (isLoggedIn) {
    const avatarSrc = !imgError && session?.user?.image
      ? session.user.image
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || 'User')}&background=6366f1&color=fff`;

    return (
      <>
        <DropdownMenu.Root open={showNotifMenu} onOpenChange={setShowNotifMenu}>
          <DropdownMenu.Trigger asChild>
            <button
              className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-colors cursor-pointer"
              aria-label={t('nav.notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[var(--error)] rounded-full text-xs font-bold text-[var(--text-inverse)] flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={8} className="z-50 outline-none">
              <NotificationDropdown onClose={() => setShowNotifMenu(false)} />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <DropdownMenu.Root key={pathname}>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors cursor-pointer"
              aria-label={t('nav.settings')}
            >
              <OptimizedImage
                src={avatarSrc}
                alt={session?.user?.name || 'User'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover"
                onError={() => setImgError(true)}
              />
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="w-56 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl py-2 z-50"
            >
              <DropdownMenu.Label className="px-4 py-2 border-b border-[var(--border)] mb-1">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {session?.user?.email}
                </p>
              </DropdownMenu.Label>

              <DropdownMenu.Item asChild>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors outline-none"
                >
                  <User className="w-4 h-4" />
                  {t('profile.title')}
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link
                  href="/library"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors outline-none md:hidden"
                >
                  <Library className="w-4 h-4" />
                  {t('nav.library')}
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link
                  href="/collections"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors outline-none md:hidden"
                >
                  <FolderOpen className="w-4 h-4" />
                  {t('nav.collections')}
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link
                  href="/messages"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors outline-none md:hidden"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('nav.messages')}
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link
                  href="/feed"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors outline-none md:hidden"
                >
                  <Rss className="w-4 h-4" />
                  {t('nav.feed')}
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link
                  href="/events"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors outline-none md:hidden"
                >
                  <Calendar className="w-4 h-4" />
                  {t('nav.events')}
                </Link>
              </DropdownMenu.Item>

              {session?.user?.role === 'CREATOR' && (
                <DropdownMenu.Item asChild>
                  <Link
                    href="/creator/dashboard"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors outline-none md:hidden"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t('creator.dashboard')}
                  </Link>
                </DropdownMenu.Item>
              )}

              {isModerator && (
                <DropdownMenu.Item asChild>
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors outline-none"
                  >
                  <Shield className="w-4 h-4" />
                  {t('nav.admin')}
                  </Link>
                </DropdownMenu.Item>
              )}

              <DropdownMenu.Item asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors outline-none"
                >
                  <Settings className="w-4 h-4" />
                  {t('common.settings')}
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-2 h-px bg-[var(--border)]" />

              <DropdownMenu.Item
                onSelect={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors cursor-pointer outline-none"
              >
                <LogOut className="w-4 h-4" />
                {t('nav.logout')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/login"
        className="hidden sm:block px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface)] transition-colors"
      >
        {t('nav.login')}
      </Link>
      <Link
        href="/auth/register"
        className="px-4 py-2 text-sm font-medium text-[var(--text-inverse)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-all"
      >
        {t('nav.register')}
      </Link>
    </div>
  );
}
