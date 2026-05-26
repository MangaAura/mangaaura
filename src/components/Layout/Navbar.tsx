'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Rss, MessageCircle, FolderOpen, Sparkles, Plus, Menu, X, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useSyncExternalStore } from 'react';

import { AuthSection } from './AuthSection';
import { MobileMenu } from './MobileMenu';
import { NavLinks, ALL_NAV_LINKS, MAIN_NAV_LINKS, MORE_NAV_LINKS, isActive, localeHref, getLocaleFromPath } from './NavLinks';
import { SearchBar } from './SearchBar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useScrolled } from '@/hooks/useScrolled';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useT } from '@/i18n';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const t = useT();
  const scrolled = useScrolled();
  const unreadMessages = useUnreadMessages();
  const unreadNotifications = useUnreadNotifications();
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname && pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const isLoggedIn = status === 'authenticated';
  const isModerator = session?.user?.role === 'MODERATOR' || session?.user?.role === 'ADMIN';
  const userId = session?.user?.id as string | undefined;

  const visibleLinks = ALL_NAV_LINKS.filter((link) => {
    if (link.requiresModerator) return mounted ? isModerator : false;
    if (link.hideWhenLoggedOut) return mounted ? isLoggedIn : false;
    return true;
  });

  const moreLinks = MORE_NAV_LINKS.filter((link) => {
    if (link.requiresModerator) return mounted ? isModerator : false;
    if (link.hideWhenLoggedOut) return mounted ? isLoggedIn : false;
    return true;
  });

  const [moreOpen, setMoreOpen] = useState(false);

  const handleSearch = (query: string) => {
    const locale = getLocaleFromPath(pathname);
    router.push(`/${locale}/explore?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <header
        className={
          'sticky top-0 z-50 w-full border-b border-[var(--border)] backdrop-blur-xl transition-all duration-300' +
          (scrolled
            ? ' bg-[var(--background)]/95 shadow-lg shadow-black/5'
            : ' bg-[var(--background)]/60 supports-[backdrop-filter]:bg-[var(--background)]/30')
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <Link href={localeHref(pathname, '/')} className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 group-hover:shadow-[var(--primary)]/30 group-hover:scale-105 transition-all duration-200">
                  <BookOpen className="w-5 h-5 text-[var(--text-inverse)]" aria-hidden="true" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  Manga<span className="text-[var(--primary)]">Aura</span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1" aria-label={t('common.menu')}>
                <NavLinks links={MAIN_NAV_LINKS} mounted={mounted} />
                {moreLinks.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setMoreOpen(!moreOpen)}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all duration-200 cursor-pointer"
                      aria-expanded={moreOpen}
                      aria-haspopup="true"
                    >
                      {t('common.more')}
                      <ChevronDown className={'w-3.5 h-3.5 transition-transform duration-200 ' + (moreOpen ? 'rotate-180' : '')} aria-hidden="true" />
                    </button>
                    <AnimatePresence>
                    {moreOpen && (
                      <>
                        <button
                          className="fixed inset-0 z-10"
                          onClick={() => setMoreOpen(false)}
                          aria-label={t('common.close')}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute top-full left-0 mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/10 py-2 z-20 origin-top-left"
                        >
                          <NavLinks links={moreLinks} mounted={mounted} />
                        </motion.div>
                      </>
                    )}
                    </AnimatePresence>
                  </div>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {mounted && isLoggedIn && (
                <div className="hidden md:flex items-center gap-0.5 mx-1 px-1.5 py-1 rounded-xl bg-[var(--surface)]/50 border border-[var(--border)]/50">
                  <Link
                    href={localeHref(pathname, '/feed')}
                    className={
                      'group relative flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200' +
                      (isActive(pathname, '/feed')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)] shadow-sm'
                        : ' text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]')
                    }
                    title={t('nav.feed')}
                    aria-current={isActive(pathname, '/feed') ? 'page' : undefined}
                  >
                    <Rss className={'w-4 h-4 ' + (isActive(pathname, '/feed') ? 'text-[var(--primary)]' : 'group-hover:scale-110 transition-transform duration-200')} aria-hidden="true" />
                    {isActive(pathname, '/feed') && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[var(--primary)]" />
                    )}
                  </Link>

                  <Link
                    href={localeHref(pathname, '/messages')}
                    className={
                      'group relative flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200' +
                      (isActive(pathname, '/messages')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)] shadow-sm'
                        : ' text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]')
                    }
                    title={t('nav.messages')}
                    aria-current={isActive(pathname, '/messages') ? 'page' : undefined}
                  >
                    <MessageCircle className={'w-4 h-4 ' + (isActive(pathname, '/messages') ? 'text-[var(--primary)]' : 'group-hover:scale-110 transition-transform duration-200')} aria-hidden="true" />
                    {isActive(pathname, '/messages') && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[var(--primary)]" />
                    )}
                    {unreadMessages > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-[var(--error)] to-rose-600 rounded-full text-[9px] font-bold text-[var(--text-inverse)] flex items-center justify-center ring-2 ring-[var(--background)] shadow-sm"
                        aria-label={t('a11y.unreadMessages', { count: unreadMessages > 9 ? '9+' : unreadMessages })}
                      >
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </motion.span>
                    )}
                  </Link>

                  <Link
                    href={localeHref(pathname, '/collections')}
                    className={
                      'group relative flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200' +
                      (isActive(pathname, '/collections')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)] shadow-sm'
                        : ' text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]')
                    }
                    title={t('nav.collections')}
                    aria-current={isActive(pathname, '/collections') ? 'page' : undefined}
                  >
                    <FolderOpen className={'w-4 h-4 ' + (isActive(pathname, '/collections') ? 'text-[var(--primary)]' : 'group-hover:scale-110 transition-transform duration-200')} aria-hidden="true" />
                    {isActive(pathname, '/collections') && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[var(--primary)]" />
                    )}
                  </Link>

                  <Link
                    href={localeHref(pathname, '/')}
                    className={
                      'group relative flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200' +
                      (isActive(pathname, '/')
                        ? ' text-amber-500 bg-amber-500/10 shadow-sm'
                        : ' text-[var(--text-tertiary)] hover:text-amber-500 hover:bg-amber-500/10')
                    }
                    title={t('creator.dashboard')}
                    aria-current={isActive(pathname, '/') ? 'page' : undefined}
                  >
                    <Sparkles className={'w-4 h-4 ' + (isActive(pathname, '/') ? '' : 'group-hover:scale-110 transition-transform duration-200')} aria-hidden="true" />
                    {isActive(pathname, '/') && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-amber-500" />
                    )}
                  </Link>

                  <Link
                    href={localeHref(pathname, '/creator/manga/new')}
                    className="group relative flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium text-[var(--text-inverse)] bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] hover:from-[var(--primary-hover)] hover:to-[var(--accent-purple)] shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-all duration-200 hover:scale-110 active:scale-95"
                    title={t('creator.newManga')}
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              )}

              <div className="flex items-center gap-1">
                <LanguageSwitcher className="hidden sm:flex" />
                <ThemeToggle />
              </div>

              <div className="hidden sm:block w-48 lg:w-64">
                <SearchBar onSearch={handleSearch} placeholder={t('common.search')} />
              </div>

              <AuthSection
                mounted={mounted}
                isLoggedIn={isLoggedIn}
                isModerator={isModerator}
                session={session}
                userId={userId}
                unreadNotifications={unreadNotifications}
                unreadMessages={unreadMessages}
              />

              <button
                className="md:hidden p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-xl transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? t('common.close') : t('common.menu')}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={visibleLinks}
        mounted={mounted}
        isLoggedIn={isLoggedIn}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
        onSearch={handleSearch}
      />
    </>
  );
}
