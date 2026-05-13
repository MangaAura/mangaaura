'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Library, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/browse', label: 'Explorar', icon: Compass },
  { href: '/library', label: 'Biblioteca', icon: Library },
  { href: '/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--surface)]/90 backdrop-blur-lg border-t border-[var(--border)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1 rounded-lg transition-colors duration-150 relative',
                active
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              )}
            >
              <Icon size={22} className={active ? 'drop-shadow-sm' : ''} />
              <span className={cn('text-[10px] font-medium', active ? 'font-semibold' : '')}>
                {label}
              </span>
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[var(--primary)] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
