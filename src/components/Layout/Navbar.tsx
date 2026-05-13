'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useScrolled } from '@/hooks/useScrolled';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SearchBar } from '@/components/Search/SearchBar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  Compass,
  ChevronDown,
  Trophy,
  BookOpen,
  Library,
  Users,
  Menu,
  X,
  User,
  Shield,
  LogOut,
  Sparkles,
  Bell,
  MessageCircle,
  Plus,
  Rss,
  Calendar,
  FolderOpen,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkDef {
  name: string;
  path: string;
  iconName: string;
  hideWhenLoggedOut?: boolean;
  requiresModerator?: boolean;
}

const ALL_NAV_LINKS: NavLinkDef[] = [
  { name: 'Inicio', path: '/', iconName: 'BookOpen' },
  { name: 'Explorar', path: '/browse', iconName: 'Compass' },
  { name: 'Rankings', path: '/rankings', iconName: 'Trophy' },
  { name: 'Foro', path: '/community/forum', iconName: 'MessageCircle' },
  { name: 'Comunidad', path: '/community', iconName: 'Users' },
  { name: 'Biblioteca', path: '/library', iconName: 'Library', hideWhenLoggedOut: true },
  { name: 'Admin', path: '/admin', iconName: 'Shield', requiresModerator: true },
];

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Compass,
  Trophy,
  Users,
  Library,
  Shield,
  Bell,
  MessageCircle,
  Plus,
  Rss,
  Calendar,
  FolderOpen,
  Settings,
  Sparkles,
};


export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeUserMenu = useCallback(() => setShowUserMenu(false), []);
  const closeNotifMenu = useCallback(() => setShowNotifMenu(false), []);
  const userMenuRef = useClickOutside<HTMLDivElement>(closeUserMenu);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const scrolled = useScrolled();
  const unreadMessages = useUnreadMessages();
  const unreadNotifications = useUnreadNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = status === 'authenticated';
  const isModerator = session?.user?.role === 'MODERATOR' || session?.user?.role === 'ADMIN';
  const userId = session?.user?.id as string | undefined;

  useEscapeKey(() => {
    if (showUserMenu) closeUserMenu();
    if (showNotifMenu) closeNotifMenu();
  });

  const visibleLinks = ALL_NAV_LINKS.filter((link) => {
    if (link.requiresModerator) return mounted ? isModerator : false;
    if (link.hideWhenLoggedOut) return mounted ? isLoggedIn : false;
    return true;
  });

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
    setShowNotifMenu(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';

    // Si hay un enlace más específico que también coincide, no marcar este como activo
    // Ej: en /community/forum, solo Foro debe estar activo, no Comunidad
    const overriddenByMoreSpecific = ALL_NAV_LINKS.some(
      (other) =>
        other.path !== path &&
        other.path.startsWith(`${path}/`) &&
        (pathname === other.path || pathname?.startsWith(`${other.path}/`))
    );
    if (overriddenByMoreSpecific) return false;

    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-[var(--border)] backdrop-blur-xl transition-all duration-300',
        scrolled
          ? 'bg-[var(--background)]/95 shadow-sm'
          : 'bg-[var(--background)]/80 supports-[backdrop-filter]:bg-[var(--background)]/60'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 group-hover:shadow-[var(--primary)]/30 transition-shadow">
                <BookOpen className="w-4 h-4 text-[var(--text-inverse)]" />
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Ink<span className="text-[var(--primary)]">Verse</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {visibleLinks.map((link) => {
                const Icon = iconComponents[link.iconName];
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                      active
                        ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                    )}
                  >
                    {mounted && Icon && <Icon className="w-4 h-4" />}
                    {!mounted && <span className="w-4 h-4" />}
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block w-48 lg:w-64">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Buscar..."
                showSuggestions={true}
              />
            </div>

            {mounted && isLoggedIn && (
              <>
                <Link
                  href="/feed"
                  className={cn(
                    'hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                    isActive('/feed')
                      ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                  )}
                  title="Feed"
                >
                  <Rss className="w-4 h-4" />
                  <span className="hidden lg:inline">Feed</span>
                </Link>

                <Link
                  href="/messages"
                  className={cn(
                    'relative hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                    isActive('/messages')
                      ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                  )}
                  title="Mensajes"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden lg:inline">Mensajes</span>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--error)] rounded-full text-[10px] font-bold text-[var(--text-inverse)] flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>

                <Link
                  href="/collections"
                  className={cn(
                    'hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                    isActive('/collections')
                      ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                  )}
                  title="Colecciones"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="hidden lg:inline">Colecciones</span>
                </Link>

                <Link
                  href="/events"
                  className={cn(
                    'hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                    isActive('/events')
                      ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                  )}
                  title="Eventos"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden lg:inline">Eventos</span>
                </Link>

                <Link
                  href="/creator/dashboard"
                  className={cn(
                    'hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-colors',
                    isActive('/creator/dashboard')
                      ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                  )}
                  title="Panel de Creador"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden lg:inline">Creador</span>
                </Link>

                <Link
                  href="/creator/manga/new"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-[var(--text-inverse)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-sm shadow-[var(--primary)]/20 transition-all"
                  title="Publicar manga"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden lg:inline">Crear</span>
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
              showUserMenu={showUserMenu}
              setShowUserMenu={setShowUserMenu}
              userMenuRef={userMenuRef}
              userId={userId}
              unreadNotifications={unreadNotifications}
              showNotifMenu={showNotifMenu}
              setShowNotifMenu={setShowNotifMenu}
              notifMenuRef={notifMenuRef}
              unreadMessages={unreadMessages}
            />

    <button
      className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-colors cursor-pointer"
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
          mobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <MobileMenu
          visibleLinks={visibleLinks}
          pathname={pathname}
          router={router}
          isLoggedIn={isLoggedIn}
          mounted={mounted}
          setMobileMenuOpen={setMobileMenuOpen}
          unreadMessages={unreadMessages}
        />
      </div>
    </header>
  );
}

interface AuthSectionProps {
  mounted: boolean;
  isLoggedIn: boolean;
  isModerator: boolean;
  session: any;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
  userMenuRef: React.RefObject<HTMLDivElement | null>;
  userId?: string;
  unreadNotifications: number;
  showNotifMenu: boolean;
  setShowNotifMenu: (show: boolean) => void;
  notifMenuRef: React.RefObject<HTMLDivElement | null>;
  unreadMessages: number;
}

function AuthSection({
  mounted,
  isLoggedIn,
  isModerator,
  session,
  showUserMenu,
  setShowUserMenu,
  userMenuRef,
  unreadNotifications,
  showNotifMenu,
  setShowNotifMenu,
  notifMenuRef,
}: AuthSectionProps) {
  const [imgError, setImgError] = useState(false);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full bg-[var(--surface)] animate-pulse" />;
  }

  if (isLoggedIn) {
    const avatarSrc = !imgError && session?.user?.image
      ? session.user.image
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.user?.name || 'User')}&background=6366f1&color=fff`;

    return (
      <>
        <div ref={notifMenuRef} className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-colors cursor-pointer"
            aria-label="Notificaciones"
            aria-haspopup="true"
            aria-expanded={showNotifMenu}
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[var(--error)] rounded-full text-xs font-bold text-[var(--text-inverse)] flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <NotificationDropdown onClose={() => setShowNotifMenu(false)} />
          )}
        </div>

        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors cursor-pointer"
            aria-label="Menú de usuario"
            aria-haspopup="true"
            aria-expanded={showUserMenu}
          >
            <img
              src={avatarSrc}
              alt={session?.user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover"
              onError={() => setImgError(true)}
            />
            <ChevronDown className={cn(
              'w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200',
              showUserMenu && 'rotate-180'
            )} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl py-2 z-50 animate-in fade-in-0 slide-in-from-top-1 duration-150">
              <div className="px-4 py-2 border-b border-[var(--border)] mb-1">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {session?.user?.email}
                </p>
              </div>
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <User className="w-4 h-4" />
                Mi Perfil
              </Link>
              <Link
                href="/library"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors md:hidden"
              >
                <Library className="w-4 h-4" />
                Mi Biblioteca
              </Link>
              <Link
                href="/collections"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors md:hidden"
              >
                <FolderOpen className="w-4 h-4" />
                Mis Colecciones
              </Link>
              <Link
                href="/messages"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors md:hidden"
              >
                <MessageCircle className="w-4 h-4" />
                Mensajes
              </Link>
              <Link
                href="/feed"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors md:hidden"
              >
                <Rss className="w-4 h-4" />
                Feed
              </Link>
              <Link
                href="/events"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors md:hidden"
              >
                <Calendar className="w-4 h-4" />
                Eventos
              </Link>
              <Link
                href="/creator/dashboard"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors md:hidden"
              >
                <Sparkles className="w-4 h-4" />
                Panel de Creador
              </Link>
              {isModerator && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Panel Admin
                </Link>
              )}
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <Settings className="w-4 h-4" />
                Configuración
              </Link>
              <div className="my-2 border-t border-[var(--border)]" />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/login"
        className="hidden sm:block px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface)] transition-colors"
      >
        Iniciar sesión
      </Link>
      <Link
        href="/auth/register"
        className="px-4 py-2 text-sm font-medium text-[var(--text-inverse)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-all"
      >
        Registrarse
      </Link>
    </div>
  );
}

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications?limit=5');
        if (!res.ok) return;
        const data = await res.json();
    if (!cancelled) setNotifications(data.notifications || []);
    } catch { console.info('[Navbar] Failed to fetch notifications'); }
      finally { if (!cancelled) setIsLoading(false); }
    };
    fetchNotifs();
    return () => { cancelled = true; };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch { console.info('[Navbar] Failed to mark notification as read'); }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { console.info('[Navbar] Failed to mark all as read'); }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-50 animate-in fade-in-0 slide-in-from-top-1 duration-150">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
        <h3 className="font-semibold text-sm text-[var(--text-primary)]">Notificaciones</h3>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-[var(--primary)] hover:underline cursor-pointer"
          >
            Marcar todas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={`notif-skeleton-${i}`} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)]" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-[var(--surface-elevated)] rounded w-3/4" />
                <div className="h-2 bg-[var(--surface-elevated)] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-8 h-8 mx-auto mb-3 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">Sin notificaciones</p>
        </div>
      ) : (
        <>
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onMarkAsRead={markAsRead}
              onClose={onClose}
            />
          ))}
          <Link
            href="/notifications"
            className="block p-3 text-center text-sm text-[var(--primary)] hover:underline border-t border-[var(--border)]"
            onClick={onClose}
          >
            Ver todas
          </Link>
        </>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onClose,
}: {
  notification: any;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}) {
  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer',
        !notification.isRead && 'bg-[var(--primary-subtle)]/30'
      )}
      onClick={() => {
        if (!notification.isRead) onMarkAsRead(notification.id);
        if (notification.link) onClose();
      }}
    >
      <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-[var(--text-tertiary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !notification.isRead && 'font-medium text-[var(--text-primary)]')}>
          {notification.title}
        </p>
        <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
          {notification.message}
        </p>
      </div>
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }
  return content;
}

interface MobileMenuProps {
  visibleLinks: NavLinkDef[];
  pathname: string;
  router: any;
  isLoggedIn: boolean;
  mounted: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  unreadMessages: number;
}

function MobileMenu({
  visibleLinks,
  pathname,
  router,
  isLoggedIn,
  mounted,
  setMobileMenuOpen,
  unreadMessages,
}: MobileMenuProps) {
  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';

    // Si hay un enlace más específico que también coincide, no marcar este como activo
    // Ej: en /community/forum, solo Foro debe estar activo, no Comunidad
    const overriddenByMoreSpecific = ALL_NAV_LINKS.some(
      (other) =>
        other.path !== path &&
        other.path.startsWith(`${path}/`) &&
        (pathname === other.path || pathname?.startsWith(`${other.path}/`))
    );
    if (overriddenByMoreSpecific) return false;

    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="px-4 py-4 space-y-3">
        <SearchBar
          onSearch={(q) => {
            router.push(`/search?q=${encodeURIComponent(q)}`);
            setMobileMenuOpen(false);
          }}
          placeholder="Buscar manga..."
          showSuggestions={true}
        />

        <nav className="space-y-1">
          {visibleLinks.map((link) => {
            const Icon = iconComponents[link.iconName];
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                href={link.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                {mounted && Icon && <Icon className="w-5 h-5" />}
                {!mounted && <span className="w-5 h-5" />}
                {link.name}
              </Link>
            );
          })}

          {mounted && isLoggedIn && (
            <>
              <div className="my-2 border-t border-[var(--border)]" />
              <Link
                href="/feed"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive('/feed')
                    ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                <Rss className="w-5 h-5" />
                Feed
              </Link>
              <Link
                href="/messages"
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive('/messages')
                    ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                <span className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5" />
                  Mensajes
                </span>
                {unreadMessages > 0 && (
                  <span className="w-5 h-5 bg-[var(--error)] rounded-full text-[10px] font-bold text-[var(--text-inverse)] flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
              <Link
                href="/collections"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive('/collections')
                    ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                <FolderOpen className="w-5 h-5" />
                Colecciones
              </Link>
              <Link
                href="/events"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive('/events')
                    ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                <Calendar className="w-5 h-5" />
                Eventos
              </Link>
              <Link
                href="/creator/manga/new"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-inverse)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Publicar manga
              </Link>
              <Link
                href="/settings"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive('/settings')
                    ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                <Settings className="w-5 h-5" />
                Configuración
              </Link>
            </>
          )}
        </nav>

        <div className="pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Tema</span>
            <ThemeToggle />
              <LanguageSwitcher variant="toggle" />
          </div>
        </div>

        {mounted && !isLoggedIn && (
          <div className="pt-3 border-t border-[var(--border)] space-y-2">
            <Link
              href="/auth/login"
              className="block w-full px-4 py-2.5 text-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/register"
              className="block w-full px-4 py-2.5 text-center text-sm font-medium text-[var(--text-inverse)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
            >
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
