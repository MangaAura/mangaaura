'use client';

import {
  Share2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useCallback } from 'react';

import { AchievementBadgeDisplay } from '@/components/Achievements/AchievementBadgeDisplay';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import type { Difficulty } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';

interface ShareAchievementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badgeId: string;
  achievementName: string;
  rarity: Difficulty;
  xpReward: number;
  userName: string;
}

const BASE_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.host}`
  : 'https://inkverse.app';

export function ShareAchievementModal({
  open,
  onOpenChange,
  badgeId,
  achievementName,
  rarity,
  xpReward,
  userName,
}: ShareAchievementProps) {
  const { data: session } = useSession();
  const displayName = userName || session?.user?.name || 'InkVerse';
  const [copied, setCopied] = useState(false);
  const [ogLoading, setOgLoading] = useState(true);
  const [ogFailed, setOgFailed] = useState(false);

  const ogImageUrl = `${BASE_URL}/api/achievements/${encodeURIComponent(badgeId)}/og?name=${encodeURIComponent(achievementName)}&rarity=${rarity}&xp=${xpReward}&user=${encodeURIComponent(displayName)}&badge=${encodeURIComponent(badgeId)}`;

  const shareUrl = `${BASE_URL}/achievements?share=${encodeURIComponent(badgeId)}`;

  const shareText = `¡He desbloqueado el logro "${achievementName}" (+${xpReward} XP) en InkVerse! 🏆`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select text
      const textArea = document.createElement('textarea');
      textArea.value = `${shareText}\n${shareUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [shareText, shareUrl]);

  const handleShareTwitter = useCallback(() => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  }, [shareText, shareUrl]);

  const handleShareWhatsApp = useCallback(() => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }, [shareText, shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Logro Desbloqueado en InkVerse',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or error
      }
    }
  }, [shareText, shareUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[var(--accent-purple)]" />
            Compartir Logro
          </DialogTitle>
          <DialogDescription>
            Comparte tu logro con amigos en redes sociales
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* OG Image preview */}
          <div className="relative w-full aspect-[1200/630] rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-sunken)]">
            {ogLoading && !ogFailed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
              </div>
            )}
            {ogFailed ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--surface)] p-4">
                <AchievementBadgeDisplay
                  badgeId={badgeId}
                  name={achievementName}
                  rarity={rarity}
                  isUnlocked={true}
                  size="lg"
                  showGlow={true}
                />
                <p className="text-sm text-[var(--text-secondary)] text-center">
                  {achievementName}
                </p>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={ogImageUrl}
                alt={`Logro: ${achievementName}`}
                className={cn(
                  'w-full h-full object-cover transition-opacity duration-300',
                  ogLoading ? 'opacity-0' : 'opacity-100'
                )}
                onLoad={() => setOgLoading(false)}
                onError={() => {
                  setOgLoading(false);
                  setOgFailed(true);
                }}
              />
            )}
          </div>

          {/* Achievement info row */}
          <div className="flex items-center gap-3 p-3 bg-[var(--surface-sunken)] rounded-lg">
            <AchievementBadgeDisplay
              badgeId={badgeId}
              name={achievementName}
              rarity={rarity}
              isUnlocked={true}
              size="sm"
              showGlow={false}
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                {achievementName}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                +{xpReward} XP • {rarity === 'LEGENDARY' ? 'Legendario' : rarity === 'HARD' ? 'Épico' : rarity === 'MEDIUM' ? 'Raro' : 'Común'}
              </p>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex flex-col gap-2">
            {/* Copy link */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[var(--success)]" />
                  <span className="text-[var(--success)]">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar enlace + texto</span>
                </>
              )}
            </Button>

            {/* Twitter / X */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleShareTwitter}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Compartir en X</span>
            </Button>

            {/* WhatsApp */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleShareWhatsApp}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>Compartir en WhatsApp</span>
            </Button>

            {/* Native share (mobile) */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleNativeShare}
              >
                <ExternalLink className="w-4 h-4" />
                <span>Compartir con...</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
