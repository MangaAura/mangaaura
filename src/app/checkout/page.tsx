/**
 * Checkout Page
 * 
 * Página para comprar InkCoins con Stripe.
 */

'use client';

import { loadStripe } from '@stripe/stripe-js/pure';
import { 
  Coins, 
  CreditCard, 
  CheckCircle, 
  Loader2,
  Sparkles,
  Zap,
  Crown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n';
import { INKCOIN_PACKAGES, formatAmount } from '@/lib/stripe';
import { cn } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useT();
  const [selectedPackage, _setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    if (!session?.user) {
      router.push('/auth/login?callbackUrl=/checkout');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error: stripeError } = await (stripe as any).redirectToCheckout({
          sessionId: data.sessionId,
        });
        if (stripeError) {
          throw new Error(stripeError.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-20 flex items-center justify-center" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[var(--background)] pt-20 text-center px-4">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">{t('checkout.loginRequired')}</h1>
          <p className="text-[var(--text-secondary)] mb-6">{t('checkout.loginRequiredDesc')}</p>
          <Button onClick={() => router.push('/auth/login?callbackUrl=/checkout')}>
            {t('checkout.login')}
          </Button>
        </div>
    );
  }

  return (
    <div className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--warning)]/20 to-[var(--warning)]/10 rounded-full border border-[var(--warning)]/30 mb-6">
              <Coins className="w-5 h-5 text-[var(--warning)]" />
              <span className="text-[var(--warning)] font-medium">{t('checkout.badge')}</span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
              {t('checkout.title')}
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
              {t('checkout.description')}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-xl p-4 text-center">
              <p className="text-[var(--error)]">{error}</p>
            </div>
          )}

          {/* Packages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {INKCOIN_PACKAGES.map((pkg, index) => (
              <div
                key={pkg.id}
                className={cn(
                  'relative bg-[var(--surface)]/50 rounded-2xl p-6 border transition-all duration-300',
                  selectedPackage === pkg.id
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                )}
              >
                {/* Popular badge */}
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--primary)] text-[var(--text-primary)] text-xs font-bold rounded-full">
                    {t('checkout.popular')}
                  </div>
                )}

                {/* Icon */}
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                  index === 0 && 'bg-[var(--surface-sunken)]',
                  index === 1 && 'bg-[var(--primary)]/20',
                  index === 2 && 'bg-[var(--accent-purple)]/20',
                  index === 3 && 'bg-[var(--warning)]/20'
                )}>
                  {index === 0 && <Coins className="w-6 h-6 text-[var(--text-secondary)]" />}
                  {index === 1 && <Zap className="w-6 h-6 text-[var(--primary)]" />}
                  {index === 2 && <Sparkles className="w-6 h-6 text-[var(--accent-purple)]" />}
                  {index === 3 && <Crown className="w-6 h-6 text-[var(--warning)]" />}
                </div>

                {/* Amount */}
                <div className="text-3xl font-bold text-[var(--text-primary)] mb-1">
                  {pkg.amount.toLocaleString()}
                </div>
                <div className="text-sm text-[var(--text-secondary)] mb-4">{t('checkout.inkCoins')}</div>

                {/* Price */}
                <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                  {formatAmount(pkg.priceUSD)}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mb-6">USD</div>

                {/* Savings */}
                {index > 0 && (
                  <div className="text-xs text-[var(--success)] mb-4">
                    {t('checkout.save')} {Math.round((1 - pkg.priceUSD / (pkg.amount * 1)) * 100)}%
                  </div>
                )}

                {/* Button */}
                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isLoading}
                  variant={selectedPackage === pkg.id ? 'default' : 'outline'}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t('checkout.buy')}
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[var(--surface)]/30 rounded-xl p-6 border border-[var(--border)]">
              <CheckCircle className="w-8 h-8 text-[var(--success)] mb-4" />
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">{t('checkout.securePayment')}</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('checkout.securePaymentDesc')}
              </p>
            </div>
            <div className="bg-[var(--surface)]/30 rounded-xl p-6 border border-[var(--border)]">
              <Coins className="w-8 h-8 text-[var(--warning)] mb-4" />
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">{t('checkout.instantDelivery')}</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('checkout.instantDeliveryDesc')}
              </p>
            </div>
            <div className="bg-[var(--surface)]/30 rounded-xl p-6 border border-[var(--border)]">
              <Sparkles className="w-8 h-8 text-[var(--accent-purple)] mb-4" />
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">{t('checkout.noExpiration')}</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('checkout.noExpirationDesc')}
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 text-center">{t('checkout.faq')}</h2>
            <div className="space-y-4">
              <details className="bg-[var(--surface)]/30 rounded-xl border border-[var(--border)]">
                <summary className="p-4 cursor-pointer font-medium text-[var(--text-primary)]">
                  {t('checkout.faq1Q')}
                </summary>
                <div className="px-4 pb-4 text-[var(--text-secondary)] text-sm">
                  {t('checkout.faq1A')}
                </div>
              </details>
              <details className="bg-[var(--surface)]/30 rounded-xl border border-[var(--border)]">
                <summary className="p-4 cursor-pointer font-medium text-[var(--text-primary)]">
                  {t('checkout.faq2Q')}
                </summary>
                <div className="px-4 pb-4 text-[var(--text-secondary)] text-sm">
                  {t('checkout.faq2A')}
                </div>
              </details>
              <details className="bg-[var(--surface)]/30 rounded-xl border border-[var(--border)]">
                <summary className="p-4 cursor-pointer font-medium text-[var(--text-primary)]">
                  {t('checkout.faq3Q')}
                </summary>
                <div className="px-4 pb-4 text-[var(--text-secondary)] text-sm">
                  {t('checkout.faq3A')}
                </div>
              </details>
            </div>
          </div>
        </div>
    </div>
  );
}
