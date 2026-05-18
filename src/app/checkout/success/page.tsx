/**
 * Checkout Success Page
 * 
 * Página de éxito después de comprar InkCoins.
 */

'use client';

import { CheckCircle, Loader2, Coins, AlertTriangle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n';




function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--info)]" />
    </div>
  );
}

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const [isVerifying, setIsVerifying] = useState(true);
  const [inkcoinsAdded, setInkcointsAdded] = useState<number | null>(null);
  const [verifyError, setVerifyError] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setIsVerifying(false);
      return;
    }

    fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.paid && data.inkcoinsAdded) {
          setInkcointsAdded(data.inkcoinsAdded);
        }
      })
      .catch(() => setVerifyError(true))
      .finally(() => setIsVerifying(false));
  }, [searchParams]);

  return (
    <div className="pt-20 pb-16 px-4">
        <div className="max-w-md mx-auto text-center">
            {isVerifying ? (
              <div className="py-12">
                <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mx-auto mb-4" />
                <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t('checkout.success.verifying')}</h1>
                <p className="text-[var(--text-secondary)]">{t('checkout.success.verifyingDesc')}</p>
              </div>
            ) : verifyError ? (
              <div className="py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--error)]/20 rounded-full mb-6">
                  <AlertTriangle className="w-10 h-10 text-[var(--error)]" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                  {t('checkout.success.error')}
                </h1>
                <p className="text-[var(--text-secondary)] mb-6">
                  {t('checkout.success.errorDesc')}
                </p>
                <div className="flex flex-col gap-3">
                  <Button onClick={() => router.push('/library')}>
                    {t('checkout.success.goLibrary')}
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/contact')}>
                    {t('checkout.success.contactSupport')}
                  </Button>
                </div>
              </div>
            ) : (
            <div className="py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--success)]/20 rounded-full mb-6">
                <CheckCircle className="w-10 h-10 text-[var(--success)]" />
              </div>

              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                {t('checkout.success.title')}
              </h1>

              <p className="text-[var(--text-secondary)] mb-6">
                {t('checkout.success.desc')}
              </p>

              {inkcoinsAdded && (
                <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-xl p-4 mb-8">
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="w-5 h-5 text-[var(--warning)]" />
                    <span className="text-2xl font-bold text-[var(--warning)]">
                      +{inkcoinsAdded.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[var(--warning)]/80 text-sm mt-1">{t('checkout.success.added')}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button onClick={() => router.push('/library')}>
                  {t('checkout.success.goLibrary')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/browse')}
                >
                  {t('checkout.success.exploreManga')}
                </Button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
