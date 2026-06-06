'use client';

import {
  BarChart3,
  Bookmark,
  Cpu,
  Hash,
  LayoutDashboard,
  Shield,
  Users,
  BookOpen,
  Settings,
  Menu,
  X,
  LogOut,
  Webhook,
  Newspaper,
  FileText,
  MessageSquare,
  MessageCircle,
  CreditCard,
  DollarSign,
  Trophy,
  ShieldCheck,
  FileWarning,
  Download,
  Mail,
  Search,
  Activity,
  Gavel,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { LogoSvg } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { RepeatedChar } from '@/components/ui/RepeatedChar';
import { useT } from '@/i18n';

interface NavGroup {
  titleKey: string;
  items: { labelKey: string; href: string; icon: React.ElementType }[];
}

const navGroups: NavGroup[] = [
  {
    titleKey: 'admin.sidebar.general',
    items: [
      { labelKey: 'admin.sidebar.dashboard', href: '/admin', icon: LayoutDashboard },
      { labelKey: 'admin.sidebar.analytics', href: '/admin/analytics/realtime', icon: BarChart3 },
      { labelKey: 'admin.sidebar.searchAnalytics', href: '/admin/search-analytics', icon: Search },
      { labelKey: 'admin.sidebar.settings', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    titleKey: 'admin.sidebar.contenido',
    items: [
      { labelKey: 'admin.sidebar.manga', href: '/admin/manga', icon: BookOpen },
      { labelKey: 'admin.sidebar.chapters', href: '/admin/chapters', icon: FileText },
      { labelKey: 'admin.sidebar.tags', href: '/admin/tags', icon: Hash },
      { labelKey: 'admin.sidebar.genres', href: '/admin/genres', icon: Bookmark },
      { labelKey: 'admin.sidebar.news', href: '/admin/news', icon: Newspaper },
      { labelKey: 'admin.sidebar.achievements', href: '/admin/achievements', icon: Trophy },
    ],
  },
  {
    titleKey: 'admin.sidebar.comunidad',
    items: [
      { labelKey: 'admin.sidebar.users', href: '/admin/users', icon: Users },
      { labelKey: 'admin.sidebar.moderation', href: '/admin/moderation', icon: Shield },
      { labelKey: 'admin.sidebar.comments', href: '/admin/comments', icon: MessageSquare },
      { labelKey: 'admin.sidebar.forum', href: '/admin/forum', icon: MessageCircle },
      { labelKey: 'admin.sidebar.clans', href: '/admin/clans', icon: UsersRound },
      { labelKey: 'admin.sidebar.bans', href: '/admin/bans', icon: Gavel },
      { labelKey: 'admin.sidebar.dmca', href: '/admin/dmca', icon: FileWarning },
      { labelKey: 'admin.sidebar.kyc', href: '/admin/kyc', icon: ShieldCheck },
    ],
  },
  {
    titleKey: 'admin.sidebar.financiero',
    items: [
      { labelKey: 'admin.sidebar.subscriptions', href: '/admin/subscriptions', icon: CreditCard },
      { labelKey: 'admin.sidebar.crowdfunding', href: '/admin/crowdfunding', icon: DollarSign },
      { labelKey: 'admin.sidebar.export', href: '/admin/export', icon: Download },
    ],
  },
  {
    titleKey: 'admin.sidebar.sistema',
    items: [
      { labelKey: 'admin.sidebar.roles', href: '/admin/roles', icon: ShieldCheck },
      { labelKey: 'admin.sidebar.webhooks', href: '/admin/webhooks', icon: Webhook },
      { labelKey: 'admin.sidebar.aiDashboard', href: '/admin/ai-dashboard', icon: Cpu },
      { labelKey: 'admin.sidebar.cspReports', href: '/admin/csp-reports', icon: Shield },
      { labelKey: 'admin.sidebar.emailTemplates', href: '/admin/email-templates', icon: Mail },
      { labelKey: 'admin.sidebar.auditLog', href: '/admin/audit-log', icon: Activity },
    ],
  },
];

export function AdminSidebar() {
  const t = useT();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-[var(--primary)] text-[var(--text-primary)] rounded-lg lg:hidden cursor-pointer"
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-[var(--surface)] text-[var(--text-primary)] transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header con logo */}
          <div className="p-6 border-b border-[var(--border)]">
            <Link href="/admin" className="flex items-center gap-3">
              <LogoSvg size={36} className="flex-shrink-0 rounded-lg" />
              <div>
                <h1 className="text-lg font-bold">{t('admin.sidebar.admin')}</h1>
                <RepeatedChar text="MANGAAURA" className="text-xs text-[var(--text-secondary)]" />
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.titleKey} className="mb-6">
                <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {t(group.titleKey)}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-150
                          ${active
                            ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]'
                          }`}
                      >
                        <Icon className={`w-4.5 h-4.5 ${active ? 'text-[var(--primary)]' : ''}`} />
                        <span className="flex-1 truncate">{t(item.labelKey)}</span>
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--border)] space-y-2">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start text-[var(--text-secondary)]">
                <LogOut className="w-4 h-4 mr-2" />
                {t('admin.sidebar.backToSite')}
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
