'use client';

import { X, Check, MousePointerClick, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import React, { useState } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface EditorModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  pages: string[];
  chapterId: string;
  initialPage?: number;
}

export default function EditorModeOverlay({ isOpen, onClose, pages, chapterId, initialPage = 0 }: EditorModeOverlayProps) {
  const { data: session } = useSession();
  const [editorPage, setEditorPage] = useState(initialPage);
  const [clickCoords, setClickCoords] = useState<{ x: number, y: number } | null>(null);
  const [reportType, setReportType] = useState('typo');
  const [isLoading, setIsLoading] = useState(false);
  const { handleError } = useErrorHandler();

  // Reset to initial page when overlay opens
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) {
      setEditorPage(initialPage);
      setClickCoords(null);
    }
  }, [isOpen, initialPage]);

  if (!isOpen) return null;

  const currentImageUrl = pages[editorPage] || '';

  const handleImageClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setClickCoords({ x, y });
  };

  const goToPrevPage = () => {
    if (editorPage > 0) {
      setEditorPage(p => p - 1);
      setClickCoords(null);
    }
  };

  const goToNextPage = () => {
    if (editorPage < pages.length - 1) {
      setEditorPage(p => p + 1);
      setClickCoords(null);
    }
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
          pageNumber: editorPage + 1,
          errorType: reportType,
          coords: clickCoords
        })
      });
      alert(`Reporte enviado. Tipo: ${reportType}. Coordenadas: X:${clickCoords.x.toFixed(2)}% Y:${clickCoords.y.toFixed(2)}%`);
    } catch (error) {
      handleError(error);
      alert("Hubo un error al enviar el reporte.");
    } finally {
      setIsLoading(false);
      setClickCoords(null);
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

      <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-8 relative">
        {/* Page navigation bar */}
        <div className="flex items-center gap-4 mb-4 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 border border-custom shadow-lg">
          <button
            onClick={goToPrevPage}
            disabled={editorPage === 0}
            className="p-1.5 rounded-full hover:bg-tertiary transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
            title="Página anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[80px] text-center select-none">
            {editorPage + 1} / {pages.length}
          </span>
          <button
            onClick={goToNextPage}
            disabled={editorPage >= pages.length - 1}
            className="p-1.5 rounded-full hover:bg-tertiary transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
            title="Página siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Page image */}
        <div className="relative inline-block shadow-2xl bg-background max-h-[80vh] cursor-crosshair">
          <OptimizedImage
            src={currentImageUrl}
            alt={`Página ${editorPage + 1}`}
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
