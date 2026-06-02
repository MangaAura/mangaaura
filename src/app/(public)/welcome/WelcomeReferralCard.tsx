'use client';

import { Gift, MessageCircle, Globe, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { useT } from '@/i18n';

export function WelcomeReferralCard() {
  const { data: session } = useSession();
  const t = useT();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch('/api/economy/referral/stats')
      .then((r) => r.json())
      .then((data) => setReferralCode(data.referralCode))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) return null;

  if (!referralCode) return null;

  const referralLink = `${window.location.origin}/auth/register?ref=${referralCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = referralLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function shareLink(platform: string) {
    const text = `¡Únete a MangaAura con mi código y gana Aura! 🎉 ${referralLink}`;
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('¡Únete a MangaAura! 🎉')}`;
        break;
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="mt-12 pt-12 border-t border-border">
      <div className="max-w-md mx-auto p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-center">
        <Gift className="w-8 h-8 text-purple-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold mb-1">{t('economy.referral.invite')}</h2>
        <p className="text-sm text-fg-secondary mb-4">
          {t('economy.referral.earn')}
        </p>
        <div className="flex items-center gap-2 justify-center mb-4">
          <code className="text-xl font-bold tracking-wider bg-black/10 dark:bg-white/10 px-4 py-2 rounded-lg">
            {referralCode}
          </code>
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
          >
            {copied ? t('economy.referral.copied') : t('economy.referral.share')}
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs text-muted">{t('economy.referral.socialShare.title')}</span>
          <button
            onClick={() => shareLink('whatsapp')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-500 text-xs font-medium hover:bg-green-500/30 transition-colors"
          >
            <MessageCircle size={14} /> {t('economy.referral.socialShare.whatsapp')}
          </button>
          <button
            onClick={() => shareLink('twitter')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-400/20 text-blue-400 text-xs font-medium hover:bg-blue-400/30 transition-colors"
          >
            <Globe size={14} /> {t('economy.referral.socialShare.twitter')}
          </button>
          <button
            onClick={() => shareLink('telegram')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-500 text-xs font-medium hover:bg-blue-500/30 transition-colors"
          >
            <Send size={14} /> {t('economy.referral.socialShare.telegram')}
          </button>
        </div>
      </div>
    </div>
  );
}
