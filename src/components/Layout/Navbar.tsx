'use client';

import {
  BookOpen, Rss, MessageCircle, FolderOpen, Calendar, Sparkles, Plus, Menu, X, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useSyncExternalStore } from 'react';

import { AuthSection } from './AuthSection';
import { MobileMenu } from './MobileMenu';
import { NavLinks, ALL_NAV_LINKS, MAIN_NAV_LINKS, MORE_NAV_LINKS, isActive } from './NavLinks';
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
  const isCreator = session?.user?.role === 'CREATOR';
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
    router.push(`/explore?q=${encodeURIComponent(query)}`);
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
              <Link href="/" className="flex items-center gap-2 group">
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
                      Más
                      <ChevronDown className={'w-3.5 h-3.5 transition-transform duration-200 ' + (moreOpen ? 'rotate-180' : '')} aria-hidden="true" />
                    </button>
                    <AnimatePresence>
                    {moreOpen && (
                      <>
                        <button
                          className="fixed inset-0 z-10"
                          onClick={() => setMoreOpen(false)}
                          aria-label="Cerrar"
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
              <div className="hidden sm:block w-48 lg:w-64">
                <SearchBar onSearch={handleSearch} placeholder={t('common.search')} />
              </div>

              {mounted && isLoggedIn && (
                <>
                  <Link
                    href="/feed"
                    className={
                      'relative hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200' +
                      (isActive(pathname, '/feed')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)] shadow-sm'
                        : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]')
                    }
                    title={t('nav.feed')}
                    aria-current={isActive(pathname, '/feed') ? 'page' : undefined}
                  >
                    <Rss className={'w-4 h-4 ' + (isActive(pathname, '/feed') ? 'text-[var(--primary)]' : '')} aria-hidden="true" />
                    <span className="hidden lg:inline">{t('nav.feed')}</span>
                  </Link>

                  <Link
                    href="/messages"
                    className={
                      'relative hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200' +
                      (isActive(pathname, '/messages')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)] shadow-sm'
                        : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]')
                    }
                    title={t('nav.messages')}
                    aria-current={isActive(pathname, '/messages') ? 'page' : undefined}
                  >
                    <MessageCircle className={'w-4 h-4 ' + (isActive(pathname, '/messages') ? 'text-[var(--primary)]' : '')} aria-hidden="true" />
                    <span className="hidden lg:inline">{t('nav.messages')}</span>
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--error)] rounded-full text-[10px] font-bold text-[var(--text-inverse)] flex items-center justify-center ring-2 ring-[var(--background)]" aria-label={t('a11y.unreadMessages', { count: unreadMessages > 9 ? '9+' : unreadMessages })}>
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/collections"
                    className={
                      'hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200' +
                      (isActive(pathname, '/collections')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)] shadow-sm'
                        : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]')
                    }
                    title={t('nav.collections')}
                    aria-current={isActive(pathname, '/collections') ? 'page' : undefined}
                  >
                    <FolderOpen className={'w-4 h-4 ' + (isActive(pathname, '/collections') ? 'text-[var(--primary)]' : '')} aria-hidden="true" />
                    <span className="hidden lg:inline">{t('nav.collections')}</span>
                  </Link>

                  <Link
                    href="/events"
                    className={
                      'hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200' +
                      (isActive(pathname, '/events')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)] shadow-sm'
                        : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]')
                    }
                    title={t('nav.events')}
                    aria-current={isActive(pathname, '/events') ? 'page' : undefined}
                  >
                    <Calendar className={'w-4 h-4 ' + (isActive(pathname, '/events') ? 'text-[var(--primary)]' : '')} aria-hidden="true" />
                    <span className="hidden lg:inline">{t('nav.events')}</span>
                  </Link>

                  {isCreator && (
                    <Link
                      href="/creator/dashboard"
                      className={
                        'hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200' +
                        (isActive(pathname, '/creator/dashboard')
                          ? ' text-[var(--primary)] bg-[var(--primary-subtle)] shadow-sm'
                          : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]')
                      }
                      title={t('creator.dashboard')}
                      aria-current={isActive(pathname, '/creator/dashboard') ? 'page' : undefined}
                    >
                      <Sparkles className={'w-4 h-4 ' + (isActive(pathname, '/creator/dashboard') ? 'text-[var(--primary)]' : '')} aria-hidden="true" />
                      <span className="hidden lg:inline">{t('creator.dashboard')}</span>
                    </Link>
                  )}

                  {isCreator && (
                    <Link
                      href="/creator/manga/new"
                      className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-inverse)] bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] hover:from-[var(--primary-hover)] hover:to-[var(--accent-purple)]/90 shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-all duration-200 hover:scale-[1.02]"
                      title={t('creator.newManga')}
                    >
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden lg:inline">{t('common.create')}</span>
                    </Link>
                  )}
                </>
              )}

              <div className="flex items-center gap-1 ml-auto">
                <LanguageSwitcher className="hidden sm:flex" />
                <ThemeToggle />
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
        isCreator={isCreator}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
        onSearch={handleSearch}
      />
    </>
  );
}
