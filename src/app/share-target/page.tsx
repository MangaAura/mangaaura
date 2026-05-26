'use client';

import { Share2, ArrowRight, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/Input';
import { NoIndex } from '@/components/SEO/NoIndex';
import { RepeatedChar } from '@/components/ui/RepeatedChar';

interface SharedData {
  title: string;
  text: string;
  url: string;
}

export default function ShareTargetPage() {
  const { data: session } = useSession();
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get('title') || '';
    const text = params.get('text') || '';
    const url = params.get('url') || params.get('link') || '';

    if (title || text || url) {
      setSharedData({ title, text, url });
      setShowModal(true);
    }
  }, []);

  const handleSave = async () => {
    if (!session?.user?.id) {
      setError('Inicia sesión para guardar contenido compartido');
      return;
    }
    if (!sharedData) return;

    setIsProcessing(true);
    setError(null);

    try {
      const sharedItems = JSON.parse(localStorage.getItem('mangaaura_shared') || '[]');
      sharedItems.push({
        ...sharedData,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem('mangaaura_shared', JSON.stringify(sharedItems));

      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el contenido');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!showModal || saved) {
    return (
      <>
        <NoIndex />
        <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Share2 className="w-16 h-16 text-muted mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {saved ? '¡Guardado!' : <>Compartir en <RepeatedChar text="MangaAura" /></>}
          </h1>
          <p className="text-muted">
            {saved ? 'El contenido fue guardado en tu biblioteca' : 'No se recibió contenido para compartir'}
          </p>
          <Link href="/" className="mt-6 inline-block px-6 py-3 bg-accent-blue text-[var(--text-inverse)] font-bold rounded-xl hover:bg-accent-blue-hover transition-colors">
            Ir al inicio
          </Link>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <NoIndex />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-secondary rounded-2xl shadow-2xl max-w-md w-full p-6 border border-custom">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-purple/20 rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5 text-accent-purple" />
            </div>
            <div>
              <h2 className="font-semibold">Compartir contenido</h2>
              <p className="text-xs text-muted">Guardar en tu biblioteca</p>
            </div>
          </div>
        <button
          onClick={() => setShowModal(false)}
          className="p-2 hover:bg-tertiary rounded-lg transition-colors cursor-pointer"
          aria-label="Cerrar"
        >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="space-y-4">
          {sharedData?.title && (
            <div>
              <label className="text-xs text-muted uppercase tracking-wider">Título</label>
              <Input value={sharedData.title} readOnly className="mt-1" />
            </div>
          )}

          {sharedData?.text && (
            <div>
              <label className="text-xs text-muted uppercase tracking-wider">Descripción</label>
              <textarea
                value={sharedData.text}
                readOnly
                rows={3}
                className="w-full mt-1 px-3 py-2 bg-tertiary border border-custom rounded-lg text-fg-primary text-sm resize-none"
              />
            </div>
          )}

          {sharedData?.url && (
            <div>
              <label className="text-xs text-muted uppercase tracking-wider">URL</label>
              <Input value={sharedData.url} readOnly className="mt-1" />
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-accent-red">{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 px-4 py-3 border border-custom text-fg-primary font-bold rounded-xl hover:bg-tertiary transition-colors"
            onClick={() => setShowModal(false)}
          >
            Cancelar
          </button>
          <button
            className="flex-1 px-4 py-3 bg-accent-blue text-[var(--text-inverse)] font-bold rounded-xl hover:bg-accent-blue-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>Guardar <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
