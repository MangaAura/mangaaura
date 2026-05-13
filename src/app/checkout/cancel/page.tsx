/**
 * Checkout Cancel Page
 * 
 * Página cuando el usuario cancela el checkout.
 */

'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';


function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--info)]" />
    </div>
  );
}

function CheckoutCancelContent() {
  const router = useRouter();

  return (
    <div className="pt-20 pb-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--surface-sunken)] rounded-full mb-6">
              <XCircle className="w-10 h-10 text-[var(--text-secondary)]" />
            </div>
            
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Compra cancelada
            </h1>
            
            <p className="text-[var(--text-secondary)] mb-8">
              No te preocupes, no se ha realizado ningún cargo. 
              Puedes intentarlo de nuevo cuando quieras.
            </p>

            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/checkout')}>
                Intentar de nuevo
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/browse')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a explorar
              </Button>
            </div>
    </div>
    </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CheckoutCancelContent />
    </Suspense>
  );
}
