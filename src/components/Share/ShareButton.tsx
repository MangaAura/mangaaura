'use client';

import { Share2 } from 'lucide-react';
import { useState } from 'react';

import { ShareModal } from './ShareModal';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  /** Title of the shared content */
  title: string;
  /** Text description for sharing */
  text: string;
  /** URL to share */
  url: string;
  /** Optional hashtags */
  hashtags?: string[];
  /** Button variant */
  variant?: 'icon' | 'full' | 'minimal';
  /** Additional class names */
  className?: string;
  /** Size */
  size?: 'sm' | 'md';
  /** Label override */
  label?: string;
}

export function ShareButton({
  title,
  text,
  url,
  hashtags,
  variant = 'icon',
  className,
  size = 'md',
  label,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);

  const sizeClasses = size === 'sm'
    ? 'p-2 text-xs'
    : 'px-3 py-2 text-sm';

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={cn(
          'flex items-center gap-1.5 rounded-xl font-medium transition-all duration-200',
          variant === 'icon' && 'p-2 hover:bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          variant === 'full' && `${sizeClasses} bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--surface-sunken)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`,
          variant === 'minimal' && 'p-1 hover:text-[var(--primary)] text-[var(--text-tertiary)]',
          className
        )}
        title="Compartir"
        aria-label="Compartir"
      >
        <Share2 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {(variant === 'full' || label) && (
          <span>{label || 'Compartir'}</span>
        )}
      </button>

      <ShareModal
        open={open}
        onOpenChange={setOpen}
        title={title}
        text={text}
        url={url}
        hashtags={hashtags}
      />
    </>
  );
}
