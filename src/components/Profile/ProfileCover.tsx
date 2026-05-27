'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface ProfileCoverProps {
  coverUrl?: string | null;
}

export function ProfileCover({ coverUrl }: ProfileCoverProps) {
  const shouldReduceMotion = useReducedMotion();

  if (coverUrl) {
    return (
      <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-t-xl overflow-hidden">
        <img
          src={coverUrl}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/60 to-transparent" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-t-xl overflow-hidden bg-gradient-to-br from-[var(--primary)]/25 via-[var(--accent-purple)]/15 to-[var(--surface)]">
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="cover-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cover-grid)" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/40 to-transparent" />

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--primary), var(--accent-purple), transparent)',
        }}
        animate={shouldReduceMotion ? {} : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="absolute top-4 right-4 w-24 h-24 rounded-full border border-[var(--primary)]/10"
        animate={shouldReduceMotion ? {} : { scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-8 right-12 w-12 h-12 rounded-full border border-[var(--accent-purple)]/10"
        animate={shouldReduceMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </div>
  );
}
