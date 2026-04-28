'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpenIcon,
  ChartBarIcon,
  HomeIcon,
  UploadIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navItems = [
  { name: 'Dashboard', href: '/creator/dashboard', icon: HomeIcon },
  { name: 'Mis Mangas', href: '/creator/dashboard', icon: BookOpenIcon },
  { name: 'Subir Capítulo', href: '/creator/upload', icon: UploadIcon },
  { name: 'Estadísticas', href: '/creator/analytics', icon: ChartBarIcon },
  { name: 'Comunidad', href: '/creator/community', icon: UsersIcon },
  { name: 'Configuración', href: '/creator/settings', icon: SettingsIcon },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'w-64 bg-slate-900 text-white flex flex-col min-h-screen',
        className
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <Link href="/creator/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpenIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">InkVerse</span>
        </Link>
        <p className="text-xs text-slate-400 mt-1">Panel de Creador</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors"
        >
          <span className="text-sm">Volver al sitio</span>
        </Link>
      </div>
    </aside>
  );
}
