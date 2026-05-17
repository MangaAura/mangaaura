'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { X, Check, MousePointerClick, Loader2 } from 'lucide-react';
import { OptimizedImage } from '@/components/Image/OptimizedImage';

interface EditorModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  chapterId: string;
  pageNumber?: number;
}

export default function EditorModeOverlay({ isOpen, onClose, imageUrl, chapterId, pageNumber = 1 }: EditorModeOverlayProps) {
  const { data: session } = useSession();
  const [clickCoords, setClickCoords] = useState<{ x: number, y: number } | null>(null);
  const [reportType, setReportType] = useState('typo');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleImageClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setClickCoords({ x, y });
  };

  const submitReport = async () => {
    if (!clickCoords || !session?.user?.id) return;
    setIsLoading(true);

    try {
      await fetch('/api/crowdsource/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          pageNumber,
          errorType: reportType,
          coords: clickCoords
        })
      });
      alert(`Reporte enviado. Tipo: ${reportType}. Coordenadas: X:${clickCoords.x.toFixed(2)}% Y:${clickCoords.y.toFixed(2)}%`);
    } catch (error) {
      console.error("Failed to submit report", error);
      alert("Hubo un error al enviar el reporte.");
    } finally {
      setIsLoading(false);
      setClickCoords(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/80 animate-fade-in-up">
      <div className="w-80 bg-secondary border-r border-custom h-full flex flex-col shadow-2xl relative z-10">
        <div className="p-4 border-b border-custom flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2"><MousePointerClick size={18} /> Modo Edición</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-tertiary text-muted">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6">
          <p className="text-sm text-muted">
            Haz clic en cualquier parte de la página para marcar un error y ayudar a la comunidad.
          </p>

          <div className="space-y-4">
            <label className="block text-sm font-semibold">Tipo de Error</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'typo', label: 'Texto/Typo' },
                { id: 'translation', label: 'Traducción' },
                { id: 'ai_artifact', label: 'Artefacto IA' },
                { id: 'other', label: 'Otro' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`py-2 px-2 text-xs rounded-lg border font-medium transition-colors ${reportType === type.id ? 'bg-accent-blue/10 border-accent-blue text-accent-blue' : 'bg-tertiary border-custom hover:bg-secondary'}`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {clickCoords ? (
            <div className="bg-tertiary p-4 rounded-xl border border-custom">
              <p className="text-sm font-semibold text-accent-green flex items-center gap-2 mb-2">
                <Check size={16} /> Ubicación marcada
              </p>
              <button
                onClick={submitReport}
                disabled={isLoading || !session?.user?.id}
                className="w-full bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] text-sm font-bold py-2 rounded-lg transition-colors flex justify-center items-center disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Enviar Reporte'}
              </button>
            </div>
          ) : (
            <div className="bg-tertiary p-4 rounded-xl border border-dashed border-custom text-center text-muted text-sm flex flex-col items-center justify-center h-32">
              {!session?.user?.id ? 'Inicia sesión para reportar errores' : 'Esperando clic en la imagen...'}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto flex items-center justify-center p-8 relative cursor-crosshair">
        <div className="relative inline-block shadow-2xl bg-background max-h-[90vh]">
          <OptimizedImage
            src={imageUrl}
            alt="Página actual"
            width={800}
            height={1200}
            objectFit="contain"
            onClick={handleImageClick}
            className="opacity-90 hover:opacity-100 transition-opacity"
          />
          {clickCoords && (
            <div
              className="absolute w-6 h-6 bg-accent-red rounded-full border-2 border-[var(--text-inverse)] shadow-lg transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center animate-bounce"
              style={{ top: `${clickCoords.y}%`, left: `${clickCoords.x}%` }}
            >
              <div className="w-2 h-2 bg-[var(--text-inverse)] rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
