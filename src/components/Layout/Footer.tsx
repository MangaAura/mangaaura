'use client';

import {
  BookOpen,
  Users,
  Trophy,
  Heart,
  Mail,
  Shield,
  FileText,
  HelpCircle,
  CalendarDays,
  CreditCard,
  Info,
  Megaphone,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { LogoSvg } from '@/components/Logo';
import { RepeatedChar } from '@/components/ui/RepeatedChar';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const footerLinks = {
  platform: [
    { labelKey: 'nav.explore', href: '/explore', icon: BookOpen },
    { labelKey: 'nav.rankings', href: '/rankings', icon: Trophy },
    { labelKey: 'nav.news', href: '/news', icon: CalendarDays },
    { labelKey: 'nav.pricing', href: '/pricing', icon: CreditCard },
    { labelKey: 'nav.community', href: '/community', icon: Users },
    { labelKey: 'nav.library', href: '/library', icon: Heart },
  ],
  support: [
    { labelKey: 'footer.help', href: '/help', icon: HelpCircle },
    { labelKey: 'footer.faq', href: '/faq', icon: HelpCircle },
    { labelKey: 'footer.contacto', href: '/contact', icon: Mail },
    { labelKey: 'footer.report', href: '/report', icon: Shield },
  ],
  resources: [
    { labelKey: 'footer.guides', href: '/guides', icon: FileText },
    { labelKey: 'footer.aboutUs', href: '/about-us', icon: Info },
    { labelKey: 'footer.announcements', href: '/announcements', icon: Megaphone },
  ],
  legal: [
    { labelKey: 'footer.terms', href: '/legal/terms', icon: FileText },
    { labelKey: 'footer.privacy', href: '/legal/privacy', icon: Shield },
    { labelKey: 'footer.dmca', href: '/legal/dmca', icon: Shield },
  ],
};

const socialLinks = [
  { name: 'X', href: 'https://x.com/MangaAura', icon: XIcon },
  { name: 'Instagram', href: 'https://instagram.com/mangaauraoficial', icon: InstagramIcon },
  { name: 'TikTok', href: 'https://tiktok.com/@mangaauraoficial', icon: TikTokIcon },
  { name: 'YouTube', href: 'https://youtube.com/@MangaAuraOficial', icon: YoutubeIcon },
  { name: 'Discord', href: 'https://discord.gg/56wKdQ2qGt', icon: DiscordIcon },
];

export function Footer({ className }: { className?: string }) {
  const t = useT();
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';

  return (
    <footer
      role="contentinfo"
      className={cn(
        'relative w-full bg-[var(--surface)] overflow-hidden',
        className
      )}
    >
      {/* Decorative gradient orbs */}
      <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-[var(--primary)]/3 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-[var(--warning)]/2 blur-3xl pointer-events-none" />

      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16 pb-2 md:pb-4">
        {/* 
          Grid layout:
          - Mobile: single column, sections stack
          - Tablet (sm): 2 cols, logo spans full width
          - Desktop (md): 3 cols, logo spans full width
          - Large (lg): 6 cols, logo spans 2, each nav section takes 1
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-10">
          {/* Logo + Social — spans full width on small screens, 2 cols on lg */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
              <LogoSvg size={36} />
              <RepeatedChar
                text="MANGAAURA"
                className="text-xl font-bold text-[var(--text-primary)] tracking-tight"
              />
            </Link>
            <p className="text-[var(--text-primary)]/65 text-sm mb-6 max-w-xs leading-relaxed">
              {t('footer.tagline')}
            </p>

            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--surface-elevated)] text-[var(--text-tertiary)] hover:bg-[var(--primary)] hover:text-[var(--text-inverse)] hover:scale-110 hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-95 transition-all duration-200"
                    aria-label={social.name}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Nav sections — each takes 1 column on lg */}
          <nav aria-label={t('footer.sectionPlatform')}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
              {t('footer.sectionPlatform')}
            </h2>
            <ul className="space-y-2.5">
              {footerLinks.platform
                .filter((link) => !link.href.includes('/library') || isLoggedIn)
                .map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.labelKey}>
                      <Link
                        href={link.href}
                        className="group/link inline-flex items-center gap-2 text-sm text-[var(--text-primary)]/70 hover:text-[var(--text-primary)] transition-all duration-200"
                        aria-label={`${t(link.labelKey)} — ${t('footer.sectionPlatform')}`}
                      >
                        <span className="w-4 h-4 flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:scale-110" />
                        </span>
                        <span className="transition-all duration-200 group-hover/link:translate-x-0.5">
                          {t(link.labelKey)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </nav>

          <nav aria-label={t('footer.sectionSupport')}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
              {t('footer.sectionSupport')}
            </h2>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.labelKey}>
                    <Link
                      href={link.href}
                      className="group/link inline-flex items-center gap-2 text-sm text-[var(--text-primary)]/70 hover:text-[var(--text-primary)] transition-all duration-200"
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:scale-110" />
                      </span>
                      <span className="transition-all duration-200 group-hover/link:translate-x-0.5">
                        {t(link.labelKey)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav aria-label={t('footer.sectionResources')}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
              {t('footer.sectionResources')}
            </h2>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.labelKey}>
                    <Link
                      href={link.href}
                      className="group/link inline-flex items-center gap-2 text-sm text-[var(--text-primary)]/70 hover:text-[var(--text-primary)] transition-all duration-200"
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:scale-110" />
                      </span>
                      <span className="transition-all duration-200 group-hover/link:translate-x-0.5">
                        {t(link.labelKey)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav aria-label={t('footer.sectionLegal')}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
              {t('footer.sectionLegal')}
            </h2>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.labelKey}>
                    <Link
                      href={link.href}
                      className="group/link inline-flex items-center gap-2 text-sm text-[var(--text-primary)]/70 hover:text-[var(--text-primary)] transition-all duration-200"
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 transition-transform duration-200 group-hover/link:scale-110" />
                      </span>
                      <span className="transition-all duration-200 group-hover/link:translate-x-0.5">
                        {t(link.labelKey)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 md:mt-16 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[var(--text-primary)]/65 text-sm text-center sm:text-left">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/legal/terms"
              className="text-xs text-[var(--text-primary)]/65 hover:text-[var(--text-primary)]/80 transition-colors duration-200"
            >
              {t('footer.termsOfService')}
            </Link>
            <span className="w-px h-3 bg-[var(--border)]" aria-hidden="true" />
            <Link
              href="/legal/privacy"
              className="text-xs text-[var(--text-primary)]/65 hover:text-[var(--text-primary)]/80 transition-colors duration-200"
            >
              {t('footer.privacyPolicy')}
            </Link>
            <span className="w-px h-3 bg-[var(--border)]" aria-hidden="true" />
            <Link
              href="/legal/dmca"
              className="text-xs text-[var(--text-primary)]/65 hover:text-[var(--text-primary)]/80 transition-colors duration-200"
            >
              {t('footer.dmca')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
