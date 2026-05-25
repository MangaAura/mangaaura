'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, ChevronDown, User, Library, FolderOpen, MessageCircle,
  Rss, Sparkles, Shield, Settings, LogOut, Crown, Zap,
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

function RoleBadge({ role, t }: { role?: string; t: (key: string) => string }) {
  if (!role || role === 'USER') return null;
  const styles: Record<string, string> = {
    CREATOR: 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    MODERATOR: 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    ADMIN: 'bg-gradient-to-r from-rose-500/20 to-rose-600/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  };
  const icons: Record<string, React.ReactNode> = {
    CREATOR: <Crown className="w-3 h-3" />,
    MODERATOR: <Shield className="w-3 h-3" />,
    ADMIN: <Zap className="w-3 h-3" />,
  };
  const labels: Record<string, string> = {
    CREATOR: t('roles.creator'),
    MODERATOR: t('roles.moderator'),
    ADMIN: t('roles.admin'),
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[role] || ''}`}>
      {icons[role]}
      {labels[role]}
    </span>
  );
}

function NotifButton({ unread, onClick, ariaLabel }: { unread: number; onClick: () => void; ariaLabel: string }) {
  const [animKey, setAnimKey] = useState(0);
  return (
    <button
      onClick={() => { setAnimKey((k) => k + 1); onClick(); }}
      className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-all duration-200 cursor-pointer active:scale-90"
      aria-label={ariaLabel}
    >
      <Bell className="w-5 h-5" />
      {unread > 0 && (
        <AnimatePresence mode="popLayout">
          <motion.span
            key={animKey}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-gradient-to-br from-[var(--error)] to-rose-600 rounded-full text-[10px] font-bold text-[var(--text-inverse)] flex items-center justify-center shadow-lg shadow-[var(--error)]/30"
          >
            {unread > 9 ? '9+' : unread}
          </motion.span>
        </AnimatePresence>
      )}
    </button>
  );
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
            <NotifButton unread={unreadNotifications} onClick={() => {}} ariaLabel={t('notifications.title')} />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={8} className="z-50 outline-none">
              <NotificationDropdown onClose={() => setShowNotifMenu(false)} />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <DropdownMenu.Root key={pathname}>
          <DropdownMenu.Trigger asChild>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex items-center gap-2 p-1 pr-2.5 rounded-xl hover:bg-[var(--surface)] transition-all duration-200 cursor-pointer"
              aria-label={t('nav.settings')}
            >
              <div className="relative">
                <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-[var(--primary)] via-[var(--accent-purple)] to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <OptimizedImage
                  src={avatarSrc}
                  alt={session?.user?.name || 'User'}
                  width={32}
                  height={32}
                  className="relative w-8 h-8 rounded-full object-cover ring-2 ring-[var(--border)] group-hover:ring-[var(--primary)]/50 transition-all duration-300"
                  onError={() => setImgError(true)}
                />
              </div>
              <span className="hidden lg:block max-w-[80px] truncate text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors duration-200">
                {session?.user?.name || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-all duration-200 group-data-[state=open]:rotate-180" />
            </motion.button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="w-64 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/10 py-2 z-50 origin-top-right overflow-hidden"
            >
              {/* Profile Card Header */}
              <div className="px-4 py-4 border-b border-[var(--border)] bg-gradient-to-b from-[var(--primary-subtle)]/30 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-[var(--primary)] via-[var(--accent-purple)] to-pink-500 opacity-60" />
                    <OptimizedImage
                      src={avatarSrc}
                      alt={session?.user?.name || 'User'}
                      width={44}
                      height={44}
                      className="relative w-11 h-11 rounded-full object-cover ring-2 ring-[var(--surface)]"
                    />
                    {session?.user?.level && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] text-[10px] font-bold text-[var(--text-inverse)] flex items-center justify-center ring-2 ring-[var(--surface)] shadow-sm">
                        {session.user.level}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {session?.user?.name || t('common.user')}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                      {session?.user?.email}
                    </p>
                    <div className="mt-1.5">
                      <RoleBadge role={session?.user?.role} t={t} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-1">
                <DropdownMenu.Item asChild>
                  <Link
                    href="/profile"
                    className="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-150 outline-none"
                  >
                    <User className="w-4 h-4 text-[var(--text-tertiary)] group-hover/item:text-[var(--primary)] transition-colors duration-150" />
                    <span className="group-hover/item:translate-x-0.5 transition-transform duration-150">
                      {t('profile.title')}
                    </span>
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/library"
                    className="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-150 outline-none md:hidden"
                  >
                    <Library className="w-4 h-4 text-[var(--text-tertiary)] group-hover/item:text-[var(--primary)] transition-colors duration-150" />
                    <span className="group-hover/item:translate-x-0.5 transition-transform duration-150">
                      {t('nav.library')}
                    </span>
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/collections"
                    className="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-150 outline-none md:hidden"
                  >
                    <FolderOpen className="w-4 h-4 text-[var(--text-tertiary)] group-hover/item:text-[var(--primary)] transition-colors duration-150" />
                    <span className="group-hover/item:translate-x-0.5 transition-transform duration-150">
                      {t('nav.collections')}
                    </span>
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/messages"
                    className="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-150 outline-none md:hidden"
                  >
                    <MessageCircle className="w-4 h-4 text-[var(--text-tertiary)] group-hover/item:text-[var(--primary)] transition-colors duration-150" />
                    <span className="group-hover/item:translate-x-0.5 transition-transform duration-150">
                      {t('nav.messages')}
                    </span>
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    href="/feed"
                    className="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-150 outline-none md:hidden"
                  >
                    <Rss className="w-4 h-4 text-[var(--text-tertiary)] group-hover/item:text-[var(--primary)] transition-colors duration-150" />
                    <span className="group-hover/item:translate-x-0.5 transition-transform duration-150">
                      {t('nav.feed')}
                    </span>
                  </Link>
                </DropdownMenu.Item>

                {session?.user?.role === 'CREATOR' && (
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/creator/dashboard"
                      className="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-150 outline-none md:hidden"
                    >
                      <Sparkles className="w-4 h-4 text-[var(--text-tertiary)] group-hover/item:text-amber-500 transition-colors duration-150" />
                      <span className="group-hover/item:translate-x-0.5 transition-transform duration-150">
                        {t('creator.dashboard')}
                      </span>
                    </Link>
                  </DropdownMenu.Item>
                )}
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mx-3" />

              <div className="py-1">
                {isModerator && (
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/admin"
                      className="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-150 outline-none"
                    >
                      <Shield className="w-4 h-4 text-[var(--text-tertiary)] group-hover/item:text-cyan-500 transition-colors duration-150" />
                      <span className="group-hover/item:translate-x-0.5 transition-transform duration-150">
                        {t('nav.admin')}
                      </span>
                    </Link>
                  </DropdownMenu.Item>
                )}

                <DropdownMenu.Item asChild>
                  <Link
                    href="/settings"
                    className="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-all duration-150 outline-none"
                  >
                    <Settings className="w-4 h-4 text-[var(--text-tertiary)] group-hover/item:text-[var(--primary)] transition-colors duration-150" />
                    <span className="group-hover/item:translate-x-0.5 transition-transform duration-150">
                      {t('common.settings')}
                    </span>
                  </Link>
                </DropdownMenu.Item>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent mx-3" />

              <div className="py-1">
                <DropdownMenu.Item
                  onSelect={() => signOut({ callbackUrl: '/' })}
                  className="group/item flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--error)]/5 transition-all duration-150 cursor-pointer outline-none"
                >
                  <LogOut className="w-4 h-4 group-hover/item:-translate-x-0.5 transition-transform duration-150" />
                  <span className="group-hover/item:translate-x-0.5 transition-transform duration-150">
                    {t('nav.logout')}
                  </span>
                </DropdownMenu.Item>
              </div>
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
        className="hidden sm:block px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface)] transition-all duration-200"
      >
        {t('nav.login')}
      </Link>
      <Link
        href="/auth/register"
        className="px-4 py-2 text-sm font-medium text-[var(--text-inverse)] bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] hover:from-[var(--primary-hover)] hover:to-[var(--accent-purple)]/90 rounded-lg shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-all duration-200 hover:scale-[1.02]"
      >
        {t('nav.register')}
      </Link>
    </div>
  );
}
