'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Rss, MessageCircle, FolderOpen, Plus, Settings, X, Bell, Crown, LogOut, Medal,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';

import { NavLinks, isActive, localeHref, type NavLinkDef } from './NavLinks';
import { SearchBar } from './SearchBar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useT } from '@/i18n';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: NavLinkDef[];
  mounted: boolean;
  isLoggedIn: boolean;
  unreadMessages: number;
  unreadNotifications?: number;
  onSearch: (query: string) => void;
}

export function MobileMenu({
  open, onClose, links, mounted, isLoggedIn, unreadMessages, unreadNotifications, onSearch,
}: MobileMenuProps) {
  const pathname = usePathname();
  const t = useT();
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement;
    } else if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  const handleSearch = (query: string) => {
    onSearch(query);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] md:hidden"
        >
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }} aria-label={t('common.close')} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-[var(--surface)] shadow-2xl shadow-black/20 overflow-y-auto rounded-l-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('common.menu')}
            id="mobile-menu"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-end">
                <button onClick={onClose} aria-label={t('common.close')} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1">
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <nav className="space-y-1" aria-label={t('common.menu')}>
                <NavLinks links={links} mounted={mounted} mobile />

                {mounted && isLoggedIn && (
                  <>
                    <div className="my-2 border-t border-[var(--border)]" />

                    <Link
                      href={localeHref(pathname, '/feed')}
                      onClick={onClose}
                      className={
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors' +
                        (isActive(pathname, '/feed')
                          ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                          : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]')
                      }
                      aria-current={isActive(pathname, '/feed') ? 'page' : undefined}
                    >
                      <Rss className="w-5 h-5" aria-hidden="true" />
                      {t('nav.feed')}
                    </Link>

                    <Link
                      href={localeHref(pathname, '/notifications')}
                      onClick={onClose}
                      className={
                        'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors' +
                        (isActive(pathname, '/notifications')
                          ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                          : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]')
                      }
                      aria-current={isActive(pathname, '/notifications') ? 'page' : undefined}
                    >
                      <span className="flex items-center gap-3">
                        <Bell className="w-5 h-5" aria-hidden="true" />
                        {t('nav.notifications')}
                      </span>
                      {(unreadNotifications ?? 0) > 0 && (
                        <span className="w-5 h-5 bg-[var(--error)] rounded-full text-[10px] font-bold text-[var(--text-inverse)] flex items-center justify-center">
                          {unreadNotifications! > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                    </Link>

                    <Link
                      href={localeHref(pathname, '/messages')}
                      onClick={onClose}
                      className={
                        'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors' +
                        (isActive(pathname, '/messages')
                          ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                          : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]')
                      }
                      aria-current={isActive(pathname, '/messages') ? 'page' : undefined}
                    >
                      <span className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5" aria-hidden="true" />
                        {t('nav.messages')}
                      </span>
                      {unreadMessages > 0 && (
                        <span className="w-5 h-5 bg-[var(--error)] rounded-full text-[10px] font-bold text-[var(--text-inverse)] flex items-center justify-center">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </span>
                      )}
                    </Link>

                    <Link
                      href={localeHref(pathname, '/collections')}
                      onClick={onClose}
                      className={
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors' +
                        (isActive(pathname, '/collections')
                          ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                          : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]')
                      }
                      aria-current={isActive(pathname, '/collections') ? 'page' : undefined}
                    >
                      <FolderOpen className="w-5 h-5" aria-hidden="true" />
                      {t('nav.collections')}
                    </Link>

                    <Link
                      href={localeHref(pathname, '/quests')}
                      onClick={onClose}
                      className={
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors' +
                        (isActive(pathname, '/quests')
                          ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                          : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]')
                      }
                      aria-current={isActive(pathname, '/quests') ? 'page' : undefined}
                    >
                      <Medal className="w-5 h-5" aria-hidden="true" />
                      {t('nav.quests')}
                    </Link>

                    <Link
                      href={localeHref(pathname, '/')}
                      onClick={onClose}
                      className={
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors' +
                        (isActive(pathname, '/creator')
                          ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                          : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]')
                      }
                      aria-current={isActive(pathname, '/creator') ? 'page' : undefined}
                    >
                      <Crown className="w-5 h-5" aria-hidden="true" />
                      {t('creator.dashboard')}
                    </Link>

                    <Link
                      href={localeHref(pathname, '/creator/manga/new')}
                      onClick={onClose}
                      className={
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors' +
                        (isActive(pathname, '/creator/manga/new')
                          ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                          : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]')
                      }
                      aria-current={isActive(pathname, '/creator/manga/new') ? 'page' : undefined}
                    >
                      <Plus className="w-5 h-5" aria-hidden="true" />
                      {t('creator.newManga')}
                    </Link>

                    <div className="my-2 border-t border-[var(--border)]" />

                    <Link
                      href={localeHref(pathname, '/settings')}
                      onClick={onClose}
                      className={
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors' +
                        (isActive(pathname, '/settings')
                          ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                          : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]')
                      }
                      aria-current={isActive(pathname, '/settings') ? 'page' : undefined}
                    >
                      <Settings className="w-5 h-5" aria-hidden="true" />
                      {t('common.settings')}
                    </Link>

                    <button
                      onClick={() => { signOut(); onClose(); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
                    >
                      <LogOut className="w-5 h-5" aria-hidden="true" />
                      {t('nav.logout')}
                    </button>
                  </>
                )}
              </nav>

              <div className="pt-3 border-t border-[var(--border)] space-y-3">
                <SearchBar
                  onSearch={handleSearch}
                  placeholder={t('common.search')}
                  className="w-full"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{t('common.theme')}</span>
                  <ThemeToggle />
                  <LanguageSwitcher variant="toggle" />
                </div>
              </div>

              {mounted && !isLoggedIn && (
                <div className="pt-3 border-t border-[var(--border)] space-y-2">
                  <Link
                    href={localeHref(pathname, '/auth/login')}
                    onClick={onClose}
                    className="block w-full px-4 py-2.5 text-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
                    aria-current={isActive(pathname, '/auth/login') ? 'page' : undefined}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    href={localeHref(pathname, '/auth/register')}
                    onClick={onClose}
                    className="block w-full px-4 py-2.5 text-center text-sm font-medium text-[var(--text-inverse)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
                    aria-current={isActive(pathname, '/auth/register') ? 'page' : undefined}
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
