'use client';

import { Share2, Check, Copy } from 'lucide-react';
import { useState, useCallback } from 'react';

export function ArticleShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const handleShare = useCallback(() => {
    if (canShare) {
      navigator.share({ title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [title, canShare]);

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-custom text-muted hover:text-fg-primary hover:border-[var(--primary)]/40 active:scale-95 transition-all"
    >
      {copied ? (
        <>
          <Check size={13} className="text-green-500" />
          Enlace copiado
        </>
      ) : (
        <>
          {canShare ? <Share2 size={13} /> : <Copy size={13} />}
          Compartir
        </>
      )}
    </button>
  );
}
