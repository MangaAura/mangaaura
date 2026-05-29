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
  Disc,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { RepeatedChar } from '@/components/ui/RepeatedChar';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

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

const footerLinks = {
  platform: [
    { labelKey: 'nav.explore', href: '/explore', icon: BookOpen },
    { labelKey: 'nav.rankings', href: '/rankings', icon: Trophy },
    { labelKey: 'nav.community', href: '/community', icon: Users },
    { labelKey: 'nav.library', href: '/library', icon: Heart },
  ],
  support: [
    { labelKey: 'footer.help', href: '/help', icon: HelpCircle },
    { labelKey: 'footer.contact', href: '/contact', icon: Mail },
    { labelKey: 'footer.report', href: '/report', icon: Shield },
  ],
  legal: [
    { labelKey: 'footer.terms', href: '/legal/terms', icon: FileText },
    { labelKey: 'footer.privacy', href: '/legal/privacy', icon: Shield },
    { labelKey: 'footer.dmca', href: '/legal/dmca', icon: Shield },
  ],
};

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com/mangaaura', icon: GithubIcon },
  { name: 'X', href: 'https://mangaaura.es', icon: XIcon },
  { name: 'Instagram', href: 'https://mangaaura.es', icon: InstagramIcon },
  { name: 'TikTok', href: 'https://mangaaura.es', icon: TikTokIcon },
  { name: 'Discord', href: '#', icon: Disc, disabled: true },
];

export function Footer({ className }: { className?: string }) {
  const t = useT();
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';

  return (
    <footer
      role="contentinfo"
      className={cn(
        'relative w-full bg-[var(--surface)]/50 backdrop-blur-xl',
        className
      )}
    >
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/MangaAura_logo_circular.svg" alt="" width={32} height={32} className="flex-shrink-0" />
              <RepeatedChar text="MANGAAURA" className="text-xl font-bold text-[var(--text-primary)]" />
            </Link>
            <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-sm">
              {t('footer.tagline')}
            </p>

            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                const isDisabled = social.disabled;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target={isDisabled ? undefined : '_blank'}
                    rel={isDisabled ? undefined : 'noopener noreferrer'}
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                      isDisabled
                        ? 'bg-[var(--surface-elevated)]/50 text-[var(--text-tertiary)]/50 cursor-not-allowed'
                        : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-[var(--text-inverse)] hover:scale-110'
                    )}
                    aria-label={isDisabled ? `${social.name} (Próximamente)` : social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          <nav aria-label={t('footer.sectionPlatform')}>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{t('footer.sectionPlatform')}</h2>
            <ul className="space-y-3">
              {footerLinks.platform
                .filter((link) => !link.href.includes('/library') || isLoggedIn)
                .map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.labelKey}>
                      <Link
                        href={link.href}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm flex items-center gap-2 transition-all hover:translate-x-0.5"
                      >
                        <Icon className="w-4 h-4" />
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </nav>

          <nav aria-label={t('footer.sectionSupport')}>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{t('footer.sectionSupport')}</h2>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.labelKey}>
                    <Link
                      href={link.href}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm flex items-center gap-2 transition-all hover:translate-x-0.5"
                    >
                      <Icon className="w-4 h-4" />
                      {t(link.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav aria-label={t('footer.sectionLegal')}>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">{t('footer.sectionLegal')}</h2>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.labelKey}>
                    <Link
                      href={link.href}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm flex items-center gap-2 transition-all hover:translate-x-0.5"
                    >
                      <Icon className="w-4 h-4" />
                      {t(link.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--text-tertiary)] text-sm">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/legal/terms"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-sm transition-colors"
            >
              {t('footer.termsOfService')}
            </Link>
            <Link
              href="/legal/privacy"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-sm transition-colors"
            >
              {t('footer.privacyPolicy')}
            </Link>
            <Link
              href="/legal/dmca"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-sm transition-colors"
            >
              {t('footer.dmca')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
