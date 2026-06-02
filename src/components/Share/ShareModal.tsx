'use client';

import {
  Share2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

interface SharePlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  bgColor: string;
}

const PLATFORMS: SharePlatform[] = [
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: 'text-white',
    hoverColor: 'group-hover:text-white',
    bgColor: 'bg-black hover:bg-gray-800',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: 'text-white',
    hoverColor: 'group-hover:text-white',
    bgColor: 'bg-[#1877F2] hover:bg-[#166fe5]',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    color: 'text-white',
    hoverColor: 'group-hover:text-white',
    bgColor: 'bg-[#25D366] hover:bg-[#20bd5a]',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    color: 'text-white',
    hoverColor: 'group-hover:text-white',
    bgColor: 'bg-[#0088cc] hover:bg-[#0077b3]',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.059l-2.295-.683a6.015 6.015 0 00-3.44.006l-2.255.677a1.25 1.25 0 11-.903-2.334l2.35-.704a7.521 7.521 0 014.206-.01l2.333.694a1.25 1.25 0 011.252 1.046zM6.613 10.22a1.871 1.871 0 100 3.742 1.871 1.871 0 000-3.742zm9.721.004a1.87 1.87 0 10-.004 3.74 1.87 1.87 0 00.004-3.74zm-5.236 4.208c1.073 0 2.07.188 2.98.502a.5.5 0 01.324.606.5.5 0 01-.606.324 7.472 7.472 0 00-2.698-.432c-.996 0-1.95.155-2.807.464a.5.5 0 01-.61-.302.5.5 0 01.303-.61 8.48 8.48 0 013.114-.552zm-1.328 1.545c-.43.003-.86.066-1.28.19a.5.5 0 01-.456-.127.5.5 0 01-.092-.537 1.84 1.84 0 013.656 0 .5.5 0 01-.546.664 3.758 3.758 0 00-1.282-.19z" />
      </svg>
    ),
    color: 'text-white',
    hoverColor: 'group-hover:text-white',
    bgColor: 'bg-[#FF4500] hover:bg-[#e03d00]',
  },
];

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Title for the shared content */
  title: string;
  /** Text description for the share */
  text: string;
  /** URL to share */
  url: string;
  /** Optional hashtags */
  hashtags?: string[];
  /** Optional: show on mobile via native share API */
  showNativeShare?: boolean;
}

export function ShareModal({
  open,
  onOpenChange,
  title,
  text,
  url,
  hashtags = [],
  showNativeShare = true,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const fullText = hashtags.length > 0
    ? `${text}\n\n${hashtags.map(h => `#${h}`).join(' ')}`
    : text;

  const handleCopyLink = useCallback(async () => {
    const content = `${fullText}\n${url}`;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [fullText, url]);

  const handlePlatform = useCallback((platformId: string) => {
    const encodedText = encodeURIComponent(fullText);
    const encodedUrl = encodeURIComponent(url);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${fullText} ${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent(title)}`,
    };

    const shareUrl = urls[platformId];
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    }
  }, [fullText, url, title]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: fullText, url });
      } catch {
        // user cancelled
      }
    }
  }, [title, fullText, url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[var(--primary)]" />
            Compartir
          </DialogTitle>
          <DialogDescription>
            {title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Share quote preview */}
          <div className="p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border)]">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
              {fullText}
            </p>
          </div>

          {/* Platform buttons grid */}
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatform(platform.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group',
                  platform.bgColor,
                  platform.color,
                )}
              >
                {platform.icon}
                <span>{platform.name}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--surface-elevated)] px-2 text-[var(--text-tertiary)]">
                o
              </span>
            </div>
          </div>

          {/* Copy link + Native share */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border',
                copied
                  ? 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]'
                  : 'border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--surface-sunken)] text-[var(--text-primary)]'
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar enlace
                </>
              )}
            </button>

            {showNativeShare && typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--surface-sunken)] text-[var(--text-primary)]"
              >
                <ExternalLink className="w-4 h-4" />
                Compartir con...
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
