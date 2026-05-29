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
  ChevronRight,
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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { RepeatedChar } from '@/components/ui/RepeatedChar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Analytics', href: '/admin/analytics/realtime', icon: BarChart3 },
  { label: 'Moderation', href: '/admin/moderation', icon: Shield },
  { label: 'Comments', href: '/admin/comments', icon: MessageSquare },
  { label: 'Forum', href: '/admin/forum', icon: MessageCircle },
  { label: 'Clans', href: '/admin/clans', icon: Shield },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Manga', href: '/admin/manga', icon: BookOpen },
  { label: 'Chapters', href: '/admin/chapters', icon: FileText },
  { label: 'Tags', href: '/admin/tags', icon: Hash },
  { label: 'Genres', href: '/admin/genres', icon: Bookmark },
  { label: 'Achievements', href: '/admin/achievements', icon: Trophy },
  { label: 'Roles (RBAC)', href: '/admin/roles', icon: ShieldCheck },
  { label: 'KYC', href: '/admin/kyc', icon: ShieldCheck },
  { label: 'DMCA', href: '/admin/dmca', icon: FileWarning },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Crowdfunding', href: '/admin/crowdfunding', icon: DollarSign },
  { label: 'Noticias', href: '/admin/news', icon: Newspaper },
  { label: 'CSP Reports', href: '/admin/csp-reports', icon: Shield },
  { label: 'AI Dashboard', href: '/admin/ai-dashboard', icon: Cpu },
  { label: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
  { label: 'Bans', href: '/admin/bans', icon: Shield },
  { label: 'Bulk Actions', href: '/admin/bulk-actions', icon: Shield },
  { label: 'Export Datos', href: '/admin/export', icon: Download },
  { label: 'Email Templates', href: '/admin/email-templates', icon: Mail },
  { label: 'Search Analytics', href: '/admin/search-analytics', icon: Search },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
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
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${active
                      ? 'bg-[var(--primary)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4" />}
                </Link>
              );
            })}
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
