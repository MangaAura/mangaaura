/**
 * Checkout Cancel Page
 * 
 * Página cuando el usuario cancela el checkout.
 */

'use client';

import { XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/Button';
import { useT } from '@/i18n';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" role="status">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--info)]" />
    </div>
  );
}

function CheckoutCancelContent() {
  const router = useRouter();
  const t = useT();

  return (
    <div className="pt-20 pb-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--surface-sunken)] rounded-full mb-6">
              <XCircle className="w-10 h-10 text-[var(--text-secondary)]" />
            </div>
            
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              {t('checkout.cancel.title')}
            </h1>
            
            <p className="text-[var(--text-secondary)] mb-8">
              {t('checkout.cancel.desc')}
            </p>

            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/checkout')}>
                {t('checkout.cancel.tryAgain')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/explore')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('checkout.cancel.backToBrowse')}
              </Button>
            </div>
    </div>
    </div>
    </div>
  );
}

export default function CheckoutCancelClient() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CheckoutCancelContent />
    </Suspense>
  );
}
