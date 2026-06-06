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

import { Button } from '@/components/ui/Button';
import { RepeatedChar } from '@/components/ui/RepeatedChar';

interface NavGroup {
  title: string;
  items: { label: string; href: string; icon: React.ElementType }[];
}

const navGroups: NavGroup[] = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics/realtime', icon: BarChart3 },
      { label: 'Search Analytics', href: '/admin/search-analytics', icon: Search },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    title: 'Contenido',
    items: [
      { label: 'Manga', href: '/admin/manga', icon: BookOpen },
      { label: 'Chapters', href: '/admin/chapters', icon: FileText },
      { label: 'Tags', href: '/admin/tags', icon: Hash },
      { label: 'Genres', href: '/admin/genres', icon: Bookmark },
      { label: 'News', href: '/admin/news', icon: Newspaper },
      { label: 'Achievements', href: '/admin/achievements', icon: Trophy },
    ],
  },
  {
    title: 'Comunidad',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Moderation', href: '/admin/moderation', icon: Shield },
      { label: 'Comments', href: '/admin/comments', icon: MessageSquare },
      { label: 'Forum', href: '/admin/forum', icon: MessageCircle },
      { label: 'Clans', href: '/admin/clans', icon: UsersRound },
      { label: 'Bans', href: '/admin/bans', icon: Gavel },
      { label: 'DMCA', href: '/admin/dmca', icon: FileWarning },
      { label: 'KYC', href: '/admin/kyc', icon: ShieldCheck },
    ],
  },
  {
    title: 'Financiero',
    items: [
      { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
      { label: 'Crowdfunding', href: '/admin/crowdfunding', icon: DollarSign },
      { label: 'Export', href: '/admin/export', icon: Download },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Roles (RBAC)', href: '/admin/roles', icon: ShieldCheck },
      { label: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
      { label: 'AI Dashboard', href: '/admin/ai-dashboard', icon: Cpu },
      { label: 'CSP Reports', href: '/admin/csp-reports', icon: Shield },
      { label: 'Email Templates', href: '/admin/email-templates', icon: Mail },
      { label: 'Audit Log', href: '/admin/audit-log', icon: Activity },
    ],
  },
];

export function AdminSidebar() {
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
          {/* Header */}
          <div className="p-6 border-b border-[var(--border)]">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-[var(--text-primary)]" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Admin</h1>
                <RepeatedChar text="MANGAAURA" className="text-xs text-[var(--text-secondary)]" />
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.title} className="mb-6">
                <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {group.title}
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
                        <span className="flex-1 truncate">{item.label}</span>
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
                Back to Site
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
