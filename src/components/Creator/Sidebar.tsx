'use client';

import {
  BookOpenIcon,
  ChartBarIcon,
  HomeIcon,
  UploadIcon,
  SettingsIcon,
  UsersIcon,
  Medal,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const navItems: { labelKey: string; href: string; icon: typeof HomeIcon }[] = [
  { labelKey: 'creator.dashboard', href: '/creator/dashboard', icon: HomeIcon },
  { labelKey: 'creator.myManga', href: '/creator/dashboard', icon: BookOpenIcon },
  { labelKey: 'creator.uploadChapter', href: '/creator/upload', icon: UploadIcon },
  { labelKey: 'nav.sponsorships', href: '/creator/sponsors', icon: Medal },
  { labelKey: 'creator.analytics', href: '/creator/analytics', icon: ChartBarIcon },
  { labelKey: 'creator.community', href: '/creator/community', icon: UsersIcon },
  { labelKey: 'common.settings', href: '/creator/settings', icon: SettingsIcon },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside
      className={cn(
        'w-64 bg-[var(--surface-sunken)] text-[var(--text-inverse)] flex flex-col min-h-screen',
        className
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-[var(--border)]">
        <Link href="/creator/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-purple)] to-[var(--primary)] rounded-lg flex items-center justify-center">
            <BookOpenIcon className="w-5 h-5 text-[var(--text-inverse)]" />
          </div>
          <span className="font-bold text-lg">InkVerse</span>
        </Link>
        <p className="text-xs text-[var(--text-secondary)] mt-1">{t('creator.dashboard')}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <li key={item.labelKey}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
? 'bg-[var(--primary)] text-[var(--text-inverse)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-inverse)]'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)]">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--text-inverse)] transition-colors"
        >
          <span className="text-sm">{t('creator.backToSite')}</span>
        </Link>
      </div>
    </aside>
  );
}
