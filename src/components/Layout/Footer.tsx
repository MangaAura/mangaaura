'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useT } from '@/i18n';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Users,
  Trophy,
  Heart,
  Mail,
  Shield,
  FileText,
  HelpCircle,
} from 'lucide-react';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
    { labelKey: 'nav.explore', href: '/browse', icon: BookOpen },
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
  { name: 'GitHub', href: 'https://github.com/inkverse', icon: GithubIcon },
  { name: 'Twitter', href: 'https://twitter.com/inkverse', icon: TwitterIcon },
  { name: 'Instagram', href: 'https://instagram.com/inkverse', icon: InstagramIcon },
];

export function Footer({ className }: { className?: string }) {
  const t = useT();
  const { status } = useSession();
  const isLoggedIn = status === 'authenticated';

  return (
    <footer
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
              <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[var(--text-inverse)]" />
              </div>
              <span className="text-xl font-bold text-[var(--text-primary)]">Inkverse</span>
            </Link>
            <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-sm">
              {t('footer.tagline')}
            </p>

            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--primary)] hover:text-[var(--text-inverse)] hover:scale-110 transition-all duration-200"
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
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
          </div>

          <div>
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
          </div>

          <div>
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
          </div>
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
