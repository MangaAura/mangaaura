'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

import { Button } from '@/components/ui/Button';

/**
 * Create a cropped image blob from a source URL and pixel crop area.
 * Uses Canvas API to extract the cropped region.
 */
async function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to create ${format} blob from canvas`));
      },
      format,
      quality
    );
  });
}

export async function createCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  outputFormat: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/webp',
  quality: number = 0.92
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas 2D context not available');

  canvas.width = Math.round(pixelCrop.width);
  canvas.height = Math.round(pixelCrop.height);

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  try {
    return await canvasToBlob(canvas, outputFormat, quality);
  } catch {
    if (outputFormat === 'image/webp') {
      return canvasToBlob(canvas, 'image/png', 0.92);
    }
    throw new Error('No se pudo generar la imagen recortada');
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (_, __, ___, ____, error) =>
      reject(error || new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

interface ImageCropperProps {
  /** The image URL to crop */
  imageSrc: string;
  /** Called when cropping is confirmed with the resulting blob */
  onCropConfirm: (croppedBlob: Blob) => void;
  /** Called when the user cancels cropping */
  onCancel: () => void;
  /** Called when an error occurs during cropping */
  onError?: (error: string) => void;
  /** Fixed aspect ratio (width/height). Default: 16/9 */
  aspect?: number;
  /** Whether the cropper is open */
  open: boolean;
  /** Header title text. Default: 'Ajustar portada' */
  title?: string;
  /** Header subtitle description. Default: 'Arrastra para encuadrar · Ratio 16:9' */
  subtitle?: string;
}

/**
 * Fullscreen modal image cropper with fixed 16:9 aspect ratio.
 * Users can drag to pan, scroll/zoom to adjust framing.
 * On confirm, crops the image client-side using Canvas and returns the blob.
 */
export default function ImageCropper({
  imageSrc,
  onCropConfirm,
  onCancel,
  onError,
  aspect = 16 / 9,
  open,
  title,
  subtitle,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const zoomRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    try {
      const blob = await createCroppedImage(imageSrc, croppedAreaPixels, 'image/webp', 0.92);
      onCropConfirm(blob);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al recortar la imagen';
      onError?.(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onCancel();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/90">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-[var(--surface)] border-b border-[var(--border)] shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {title || 'Ajustar portada'}
          </h2>
          <p className="text-xs text-[var(--text-tertiary)]">
            {subtitle || 'Arrastra para encuadrar · Ratio 16:9'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel} disabled={processing}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={processing}>
            {processing ? 'Procesando...' : 'Aplicar recorte'}
          </Button>
        </div>
      </div>

      {/* Cropper area */}
      <div className="relative flex-1">
        <div className="absolute inset-0">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            restrictPosition
            zoomWithScroll
            showGrid
            style={{
              containerStyle: {
                background: '#0a0a0a',
              },
              cropAreaStyle: {
                border: '2px solid rgba(99, 102, 241, 0.6)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
              },
            }}
          />
        </div>
      </div>

      {/* Bottom zoom control */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 bg-[var(--surface)] border-t border-[var(--border)] shrink-0">
        <SlidersHorizontal className="w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          ref={zoomRef}
          type="range"
          name="cropper-zoom"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-64 h-1.5 bg-[var(--surface-sunken)] rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)]
            [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-[var(--primary)] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          aria-label="Zoom"
        />
        <span className="text-xs text-[var(--text-secondary)] w-8 text-right tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
}
