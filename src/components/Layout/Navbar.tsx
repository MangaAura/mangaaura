'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SearchBar } from '@/components/Search/SearchBar';
import { 
  Search,
  ChevronDown,
  Trophy,
  BookOpen,
  Library,
  Users,
  Compass,
  Menu,
  X,
  User,
  Shield,
  LogOut,
  Sparkles
} from 'lucide-react';
import NotificationBell from '@/components/Notifications/NotificationBell';
import { cn } from '@/lib/utils';

// Definición de tipos para los links
interface NavLinkDef {
  name: string;
  path: string;
  iconName: 'Compass' | 'BookOpen' | 'Trophy' | 'Users' | 'Library' | 'Shield';
  hideWhenLoggedOut?: boolean;
  requiresModerator?: boolean;
}

// Todos los links definidos de forma estática
const ALL_NAV_LINKS: NavLinkDef[] = [
  { name: 'Inicio', path: '/', iconName: 'Compass' },
  { name: 'Explorar', path: '/browse', iconName: 'BookOpen' },
  { name: 'Rankings', path: '/rankings', iconName: 'Trophy' },
  { name: 'Comunidad', path: '/community', iconName: 'Users' },
  { name: 'Biblioteca', path: '/library', iconName: 'Library', hideWhenLoggedOut: true },
  { name: 'Admin', path: '/admin', iconName: 'Shield', requiresModerator: true },
];

// Mapeo de nombres a componentes de iconos
const iconComponents = {
  Compass,
  BookOpen,
  Trophy,
  Users,
  Library,
  Shield,
};

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Estado para controlar hidratación
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = status === 'authenticated';
  const isModerator = session?.user?.role === 'MODERATOR' || session?.user?.role === 'ADMIN';

  // Filtrar links de forma consistente
  const visibleLinks = ALL_NAV_LINKS.filter((link) => {
    // Si requiere moderador, solo mostrar si es moderador
    if (link.requiresModerator) {
      return mounted ? isModerator : false; // En SSR, nunca mostrar Admin
    }
    // Si se oculta cuando no está logueado
    if (link.hideWhenLoggedOut) {
      return mounted ? isLoggedIn : false; // En SSR, nunca mostrar Biblioteca
    }
    // Links normales siempre visibles
    return true;
  });

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--background)]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20 group-hover:shadow-[var(--primary)]/30 transition-shadow">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Ink<span className="text-[var(--primary)]">Verse</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleLinks.map((link) => {
                const Icon = iconComponents[link.iconName];
                const isActive = pathname === link.path || pathname?.startsWith(`${link.path}/`);
                return (
                  <Link
                    key={link.name}
                    href={link.path}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                    )}
                  >
                    {mounted && <Icon className="w-4 h-4" />}
                    {!mounted && <span className="w-4 h-4" />}
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search - Desktop */}
            <div className="hidden sm:block w-48 lg:w-64">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Buscar..."
                showSuggestions={true}
              />
            </div>

            {/* Theme Toggle */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Auth Section - Renderizado condicional basado en estado */}
            <AuthSection 
              mounted={mounted}
              isLoggedIn={isLoggedIn}
              isModerator={isModerator}
              session={session}
              showUserMenu={showUserMenu}
              setShowUserMenu={setShowUserMenu}
            />

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <MobileMenu
          visibleLinks={visibleLinks}
          pathname={pathname}
          router={router}
          isLoggedIn={isLoggedIn}
          mounted={mounted}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      )}
    </header>
  );
}

// Componente separado para la sección de auth - evita hydration mismatch
interface AuthSectionProps {
  mounted: boolean;
  isLoggedIn: boolean;
  isModerator: boolean;
  session: any;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
}

function AuthSection({
  mounted,
  isLoggedIn,
  isModerator,
  session,
  showUserMenu,
  setShowUserMenu,
}: AuthSectionProps) {
  // Durante SSR y carga inicial, mostrar placeholder
  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--surface)] animate-pulse" />
    );
  }

  // Usuario autenticado
  if (isLoggedIn) {
    return (
      <>
        <NotificationBell />
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--surface)] transition-colors"
          >
            <img
              src={session?.user?.image || `https://ui-avatars.com/api/?name=${session?.user?.name || 'User'}&background=6366f1&color=fff`}
              alt={session?.user?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl py-2 z-50">
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
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
              >
                <Library className="w-4 h-4" />
                Mi Biblioteca
              </Link>
              <Link
                href="/creator/dashboard"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
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
              <div className="my-2 border-t border-[var(--border)]" />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
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

  // Usuario no autenticado
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
        className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/30 transition-all"
      >
        Registrarse
      </Link>
    </div>
  );
}

// Componente separado para el menú móvil
interface MobileMenuProps {
  visibleLinks: NavLinkDef[];
  pathname: string;
  router: any;
  isLoggedIn: boolean;
  mounted: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

function MobileMenu({
  visibleLinks,
  pathname,
  router,
  isLoggedIn,
  mounted,
  setMobileMenuOpen,
}: MobileMenuProps) {
  return (
    <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="px-4 py-4 space-y-3">
        {/* Mobile Search */}
        <SearchBar
          onSearch={(q) => {
            router.push(`/search?q=${encodeURIComponent(q)}`);
            setMobileMenuOpen(false);
          }}
          placeholder="Buscar manga..."
          showSuggestions={true}
        />

        {/* Mobile Nav Links */}
        <nav className="space-y-1">
          {visibleLinks.map((link) => {
            const Icon = iconComponents[link.iconName];
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.name}
                href={link.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'text-[var(--primary)] bg-[var(--primary-subtle)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                )}
              >
                {mounted && <Icon className="w-5 h-5" />}
                {!mounted && <span className="w-5 h-5" />}
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Theme Toggle */}
        <div className="pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Tema</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Auth - Solo mostrar después de montar */}
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
              className="block w-full px-4 py-2.5 text-center text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
            >
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
