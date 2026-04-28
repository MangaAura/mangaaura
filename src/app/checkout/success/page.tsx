/**
 * Checkout Success Page
 * 
 * Página de éxito después de comprar InkCoins.
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Navbar from '@/components/Layout/Navbar';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );
}

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [inkcoinsAdded, setInkcointsAdded] = useState<number | null>(null);

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
      .catch(console.error)
      .finally(() => setIsVerifying(false));
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <div className="pt-20 pb-16 px-4">
        <div className="max-w-md mx-auto text-center">
          {isVerifying ? (
            <div className="py-12">
              <Loader2 className="w-12 h-12 animate-spin text-[var(--primary)] mx-auto mb-4" />
              <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Verificando tu compra...</h1>
              <p className="text-[var(--text-secondary)]">Esto solo tomará un momento</p>
            </div>
          ) : (
            <div className="py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--success)]/20 rounded-full mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>

              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                ¡Compra exitosa!
              </h1>

              <p className="text-[var(--text-secondary)] mb-6">
                Tus InkCoins han sido añadidos a tu cuenta.
              </p>

              {inkcoinsAdded && (
                <div className="bg-[var(--warning)]/10 border border-amber-500/30 rounded-xl p-4 mb-8">
                  <div className="flex items-center justify-center gap-2">
                    <Coins className="w-5 h-5 text-[var(--warning)]" />
                    <span className="text-2xl font-bold text-[var(--warning)]">
                      +{inkcoinsAdded.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-amber-300/80 text-sm mt-1">InkCoins añadidos</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button onClick={() => router.push('/library')}>
                  Ir a mi biblioteca
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/browse')}
                >
                  Explorar mangas
                </Button>
              </div>
            </div>
          )}
        </div>
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
