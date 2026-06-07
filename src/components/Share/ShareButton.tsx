'use client';

import { Check, Copy, Share2 } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  url?: string;
  title: string;
  text?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  iconOnly?: boolean;
}

export function ShareButton({
  url,
  title,
  text,
  variant = 'outline',
  size = 'sm',
  className,
  iconOnly,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = text || `Mira esto en MangaAura: ${title}`;

  const handleShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [shareUrl, shareText, title]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={cn(className)}
      aria-label={copied ? 'Enlace copiado' : `Compartir ${title}`}
    >
      {copied ? (
        <Check className={cn('w-4 h-4', !iconOnly && 'mr-1.5')} />
      ) : (
        <Share2 className={cn('w-4 h-4', !iconOnly && 'mr-1.5')} />
      )}
      {copied ? (
        iconOnly ? null : <span>Copiado</span>
      ) : iconOnly ? null : (
        iconOnly ? null : <span>Compartir</span>
      )}
    </Button>
  );
}

export function CopyLinkButton({
  url,
  label = 'Copiar enlace',
  className,
}: {
  url?: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const link = url || (typeof window !== 'undefined' ? window.location.href : '');
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [url]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium transition-colors',
        copied ? 'text-[var(--success)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        className,
      )}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? '¡Copiado!' : label}
    </button>
  );
}
