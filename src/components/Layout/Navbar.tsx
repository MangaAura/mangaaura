'use client';

import {
  BookOpen, Rss, MessageCircle, FolderOpen, Calendar, Sparkles, Plus, Menu, X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useSyncExternalStore } from 'react';

import { AuthSection } from './AuthSection';
import { MobileMenu } from './MobileMenu';
import { NavLinks, ALL_NAV_LINKS, isActive } from './NavLinks';
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

  const handleSearch = (query: string) => {
    router.push(`/explore?q=${encodeURIComponent(query)}`);
  };

  return (
    <>
      <header
        className={
          'sticky top-0 z-50 w-full border-b border-[var(--border)] backdrop-blur-xl transition-all duration-300' +
          (scrolled
            ? ' bg-[var(--background)]/95 shadow-sm'
            : ' bg-[var(--background)]/80 supports-[backdrop-filter]:bg-[var(--background)]/60')
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 group-hover:shadow-[var(--primary)]/30 transition-shadow">
                  <BookOpen className="w-4 h-4 text-[var(--text-inverse)]" aria-hidden="true" />
                </div>
                <span className="text-lg font-semibold tracking-tight">
                  Manga<span className="text-[var(--primary)]">Aura</span>
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1" aria-label={t('common.menu')}>
                <NavLinks links={visibleLinks} mounted={mounted} />
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
                      'hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm transition-colors' +
                      (isActive(pathname, '/feed')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                        : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]')
                    }
                    title={t('nav.feed')}
                    aria-current={isActive(pathname, '/feed') ? 'page' : undefined}
                  >
                    <Rss className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden lg:inline">{t('nav.feed')}</span>
                  </Link>

                  <Link
                    href="/messages"
                    className={
                      'relative hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm transition-colors' +
                      (isActive(pathname, '/messages')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                        : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]')
                    }
                    title={t('nav.messages')}
                    aria-current={isActive(pathname, '/messages') ? 'page' : undefined}
                  >
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden lg:inline">{t('nav.messages')}</span>
                    {unreadMessages > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--error)] rounded-full text-[10px] font-bold text-[var(--text-inverse)] flex items-center justify-center" aria-label={t('a11y.unreadMessages', { count: unreadMessages > 9 ? '9+' : unreadMessages })}>
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/collections"
                    className={
                      'hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm transition-colors' +
                      (isActive(pathname, '/collections')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                        : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]')
                    }
                    title={t('nav.collections')}
                    aria-current={isActive(pathname, '/collections') ? 'page' : undefined}
                  >
                    <FolderOpen className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden lg:inline">{t('nav.collections')}</span>
                  </Link>

                  <Link
                    href="/events"
                    className={
                      'hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm transition-colors' +
                      (isActive(pathname, '/events')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                        : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]')
                    }
                    title={t('nav.events')}
                    aria-current={isActive(pathname, '/events') ? 'page' : undefined}
                  >
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden lg:inline">{t('nav.events')}</span>
                  </Link>

                  <Link
                    href="/creator/dashboard"
                    className={
                      'hidden md:flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm transition-colors' +
                      (isActive(pathname, '/creator/dashboard')
                        ? ' text-[var(--primary)] bg-[var(--primary-subtle)]'
                        : ' text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]')
                    }
                    title={t('creator.dashboard')}
                    aria-current={isActive(pathname, '/creator/dashboard') ? 'page' : undefined}
                  >
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden lg:inline">{t('creator.dashboard')}</span>
                  </Link>

                  <Link
                    href="/creator/manga/new"
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-[var(--text-inverse)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-sm shadow-[var(--primary)]/20 transition-all"
                    title={t('creator.newManga')}
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden lg:inline">{t('common.create')}</span>
                  </Link>
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
                className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1"
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
