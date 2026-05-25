'use client';

import { X, Download, Type, Loader2, Share2 } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import FocusLock from 'react-focus-lock';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { extractApiError } from '@/lib/extract-api-error';

interface MemeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  chapterId?: string;
  mangaTitle?: string;
  chapterNumber?: number;
}

export default function MemeGeneratorModal({ isOpen, onClose, imageUrl, mangaTitle, chapterNumber }: MemeGeneratorModalProps) {
  // Always call hooks before any early returns
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { handleError } = useErrorHandler();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [titleId] = useState(() => `meme-title-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (isOpen) {
      const trigger = document.activeElement as HTMLElement;
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
        trigger?.focus();
      };
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(img.width / 12, 24);
      ctx.font = `bold ${fontSize}px Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = fontSize / 10;
      ctx.strokeStyle = 'black';
      ctx.fillStyle = 'white';

      if (topText) {
        const y = fontSize + 10;
        ctx.strokeText(topText.toUpperCase(), canvas.width / 2, y);
        ctx.fillText(topText.toUpperCase(), canvas.width / 2, y);
      }

      if (bottomText) {
        const y = canvas.height - 20;
        ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, y);
        ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, y);
      }

      ctx.font = `bold ${Math.max(fontSize / 3, 12)}px monospace`;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'right';
      ctx.fillText('MANGA AURA', canvas.width - 10, canvas.height - 10);
    };
    img.src = imageUrl;
  }, [imageUrl, topText, bottomText]);

  if (!isOpen) return null;

  const handleDownload = () => {
    renderCanvas();
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `meme-mangaaura-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handleSaveToGallery = async () => {
    renderCanvas();
    setIsUploading(true);

    try {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to create image');

      const formData = new FormData();
      formData.append('image', blob, `meme-${Date.now()}.png`);
      formData.append('panelId', `meme-${Date.now()}`);
      if (mangaTitle) formData.append('mangaTitle', mangaTitle);
      if (chapterNumber) formData.append('chapterNumber', String(chapterNumber));
      formData.append('texts', JSON.stringify({ top: topText, bottom: bottomText }));

      const res = await fetch('/api/memes', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const { message } = await extractApiError(res);
        throw new Error(message);
      }
      setIsSaved(true);
    } catch (err) {
      handleError(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setTopText('');
    setBottomText('');
    setIsSaved(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <FocusLock returnFocus>
      <canvas ref={canvasRef} className="hidden" />
      <div className="bg-secondary w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-custom">
        <div className="flex justify-between items-center p-4 border-b border-custom">
          <h2 id={titleId} className="text-lg font-bold flex items-center gap-2"><Type size={20} /> Generador de Memes</h2>
          <button onClick={handleClose} className="p-1 rounded hover:bg-tertiary transition-colors cursor-pointer" aria-label="Cerrar">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          <div className="relative w-full aspect-square bg-[var(--surface-sunken)] rounded-lg overflow-hidden flex items-center justify-center">
            <OptimizedImage src={imageUrl} alt="Meme template" fill className="object-cover opacity-60" />

            <div className="absolute inset-0 flex flex-col justify-between py-4 px-2 text-center">
              <h3 className="text-[var(--text-inverse)] text-3xl font-black uppercase" style={{ WebkitTextStroke: '1px black', textShadow: '2px 2px 0 #000' }}>
                {topText || "TEXTO SUPERIOR"}
              </h3>
              <h3 className="text-[var(--text-inverse)] text-3xl font-black uppercase" style={{ WebkitTextStroke: '1px black', textShadow: '2px 2px 0 #000' }}>
                {bottomText || "TEXTO INFERIOR"}
              </h3>
            </div>

            <div className="absolute bottom-2 right-2 text-[var(--text-inverse)]/50 text-xs font-bold font-mono">
              MANGA AURA
            </div>
          </div>

          {isSaved ? (
            <div className="text-center p-4 bg-accent-green/10 rounded-xl border border-accent-green/20">
              <p className="text-accent-green font-bold">¡Meme guardado en la galería!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="meme-top-text" className="block text-sm font-semibold mb-1">Texto Superior</label>
                <input
                  id="meme-top-text"
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="Escribe algo gracioso..."
                  className="w-full bg-tertiary border border-custom rounded-lg px-4 py-2 focus:outline-none focus:border-accent-blue"
                />
              </div>
              <div>
                <label htmlFor="meme-bottom-text" className="block text-sm font-semibold mb-1">Texto Inferior</label>
                <input
                  id="meme-bottom-text"
                  type="text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="Remate del chiste..."
                  className="w-full bg-tertiary border border-custom rounded-lg px-4 py-2 focus:outline-none focus:border-accent-blue"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-custom bg-tertiary flex justify-end gap-3">
          <button onClick={handleClose} className="px-4 py-2 text-sm font-semibold hover:bg-secondary rounded-lg transition-colors border border-custom cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleDownload} className="px-4 py-2 text-sm font-semibold bg-tertiary border border-custom hover:bg-secondary rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
            <Download size={16} /> Descargar
          </button>
          <button
            onClick={handleSaveToGallery}
            disabled={isUploading || isSaved}
            className="px-4 py-2 text-sm font-semibold bg-accent-blue hover:bg-accent-blue-hover text-[var(--text-inverse)] rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            {isUploading ? 'Guardando...' : isSaved ? 'Guardado' : 'Compartir'}
          </button>
        </div>
      </div>
      </FocusLock>
    </div>
  );
}