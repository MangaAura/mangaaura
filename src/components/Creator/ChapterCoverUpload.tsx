'use client';

import { ImageIcon, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';

import { OptimizedImage } from '@/components/Image/OptimizedImage';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ImageCropperUploader, type ImageCropperUploaderHandle } from '@/components/ui/ImageCropperUploader';

interface ChapterCoverUploadProps {
  onCoverChange: (url: string | null) => void;
  currentCover: string | null;
}

export function ChapterCoverUpload({ onCoverChange, currentCover }: ChapterCoverUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const cropperRef = useRef<ImageCropperUploaderHandle>(null);

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const file = new File([croppedBlob], 'cover.webp', { type: 'image/webp' });
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al subir la portada');
      }

      const data = await res.json();
      onCoverChange(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir la portada');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onCoverChange(null);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1 uppercase">
        Portada del Capítulo (Opcional)
      </label>

      {currentCover ? (
        <div className="relative group rounded-lg overflow-hidden border border-[var(--border)]">
          <OptimizedImage
            src={currentCover}
            alt="Portada del capítulo"
            width={200}
            height={280}
            className="w-full aspect-[5/7] object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => cropperRef.current?.open()}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              title="Cambiar portada"
            >
              <UploadCloud size={18} className="text-white" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500/60 hover:bg-red-500/80 rounded-full transition-colors"
              title="Eliminar portada"
            >
              <Trash2 size={18} className="text-white" />
            </button>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 text-center">
            Portada del capítulo — pasa el ratón para cambiar o eliminar
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => cropperRef.current?.open()}
          disabled={isUploading}
          className="w-full aspect-[5/7] border-2 border-dashed border-[var(--border-strong)] rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
              <span className="text-xs text-[var(--text-tertiary)]">Subiendo...</span>
            </>
          ) : (
            <>
              <ImageIcon size={24} className="text-[var(--text-tertiary)]" />
              <span className="text-xs text-[var(--text-tertiary)]">Añadir portada</span>
            </>
          )}
        </button>
      )}

      <ImageCropperUploader
        ref={cropperRef}
        aspect={5 / 7}
        cropperTitle="Ajustar portada del capítulo"
        cropperSubtitle="Arrastra para encuadrar · Ratio 5:7 (vertical)"
        onCropComplete={handleCropConfirm}
        onError={(err: string) => setUploadError(err)}
      />

      {uploadError && (
        <ErrorMessage message={uploadError} />
      )}
    </div>
  );
}
