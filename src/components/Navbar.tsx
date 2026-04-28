'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserXPBar } from './UserXPBar';
import { cn } from '@/lib/utils';
import {
  Search,
  BookOpen,
  Trophy,
  Users,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/browse?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              InkVerse
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Buscar mangas..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/browse"
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors"
            >
              Explorar
            </Link>
            <Link
              href="/rankings"
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1"
            >
              <Trophy className="w-4 h-4" />
              Rankings
            </Link>
            <Link
              href="/community"
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1"
            >
              <Users className="w-4 h-4" />
              Clanes
            </Link>

            {status === 'loading' ? (
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
            ) : session?.user ? (
              <div className="flex items-center gap-4">
                <UserXPBar compact />
                <div className="relative group">
                  <button className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {session.user.name?.charAt(0) ||
                        session.user.email?.charAt(0) ||
                        'U'}
                    </div>
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="bg-white rounded-lg shadow-lg border border-slate-200 py-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <User className="w-4 h-4" />
                        Perfil
                      </Link>
                      <Link
                        href="/library"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <BookOpen className="w-4 h-4" />
                        Mi Biblioteca
                      </Link>
                      {session.user.role === 'CREATOR' && (
                        <Link
                          href="/creator"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Studio
                        </Link>
                      )}
                      <hr className="my-2 border-slate-100" />
                      <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-slate-600" />
            ) : (
              <Menu className="w-6 h-6 text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'md:hidden border-t border-slate-200 overflow-hidden transition-all',
          isMenuOpen ? 'max-h-screen' : 'max-h-0'
        )}
      >
        <div className="px-4 py-4 space-y-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Buscar mangas..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Mobile Links */}
          <div className="space-y-2">
            <Link
              href="/browse"
              className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Explorar
            </Link>
            <Link
              href="/rankings"
              className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Rankings
            </Link>
            <Link
              href="/community"
              className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Clanes
            </Link>
          </div>

          {session?.user && (
            <>
              <hr className="border-slate-200" />
              <div className="space-y-2">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Perfil
                </Link>
                <Link
                  href="/library"
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Mi Biblioteca
                </Link>
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
