'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ProfileCompletionMeterProps {
  hasAvatar: boolean;
  hasCover: boolean;
  hasBio: boolean;
  hasWebsite: boolean;
  hasSocialLinks: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const items = [
  { key: 'avatar', labelKey: 'profileCompletion.avatar' },
  { key: 'cover', labelKey: 'profileCompletion.cover' },
  { key: 'bio', labelKey: 'profileCompletion.bio' },
  { key: 'website', labelKey: 'profileCompletion.website' },
  { key: 'social', labelKey: 'profileCompletion.social' },
] as const;

export function ProfileCompletionMeter({ hasAvatar, hasCover, hasBio, hasWebsite, hasSocialLinks, t }: ProfileCompletionMeterProps) {
  const checks = { avatar: hasAvatar, cover: hasCover, bio: hasBio, website: hasWebsite, social: hasSocialLinks };
  const completed = Object.values(checks).filter(Boolean).length;
  const total = items.length;
  const percentage = Math.round((completed / total) * 100);

  if (percentage === 100) return null;

  const missing = items.filter((item) => !checks[item.key]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          {t('profileCompletion.title')}
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">{completed}/{total}</span>
      </div>

      <div className="relative h-2 rounded-full bg-[var(--border)] overflow-hidden mb-3">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {missing.length > 0 && (
        <Link
          href="/settings"
          className="text-xs text-[var(--text-tertiary)] hover:text-[var(--primary)] transition-colors"
        >
          {t('profileCompletion.missing', { items: missing.map((m) => t(m.labelKey)).join(', ') })}
        </Link>
      )}
    </motion.div>
  );
}
