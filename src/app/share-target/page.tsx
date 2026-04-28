'use client';

import { useEffect, useState } from 'react';
import { Share2, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

interface SharedData {
  title: string;
  text: string;
  url: string;
}

export default function ShareTargetPage() {
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Parse URL parameters for shared content
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
    setIsProcessing(true);
    // Here you would save to user's saved items
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsProcessing(false);
    setShowModal(false);
  };

  if (!showModal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Share2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Compartir en InkVerse</h1>
          <p className="text-slate-400">No se recibió contenido para compartir</p>
          <Button asChild className="mt-6">
            <Link href="/">Ir al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Compartir contenido</h2>
              <p className="text-xs text-slate-400">Guardar en tu biblioteca</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {sharedData?.title && (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">
                Título
              </label>
              <Input
                value={sharedData.title}
                readOnly
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          )}

          {sharedData?.text && (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">
                Descripción
              </label>
              <textarea
                value={sharedData.text}
                readOnly
                rows={3}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm resize-none"
              />
            </div>
          )}

          {sharedData?.url && (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">
                URL
              </label>
              <Input
                value={sharedData.url}
                readOnly
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 border-slate-700 text-white hover:bg-slate-800"
            onClick={() => setShowModal(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500"
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isProcessing ? (
              'Guardando...'
            ) : (
              <>
                Guardar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
