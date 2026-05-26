'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  type ChangeEvent,
} from 'react';

import ImageCropper from '@/components/ui/ImageCropper';

export interface ImageCropperUploaderHandle {
  /** Open the native file picker dialog */
  open: () => void;
  /**
   * Process a file directly (e.g. from drag-and-drop).
   * Validates type/size and opens the cropper modal.
   */
  processFile: (file: File) => void;
}

interface ImageCropperUploaderProps {
  /** Fixed aspect ratio (width/height). Default: 16/9 */
  aspect?: number;
  /** Header title for the cropper modal */
  cropperTitle?: string;
  /** Header subtitle for the cropper modal */
  cropperSubtitle?: string;
  /** Accepted MIME types, comma-separated. Default: 'image/jpeg,image/png,image/webp,image/gif,image/avif' */
  accept?: string;
  /** Max file size in bytes. Default: 10MB (10 * 1024 * 1024) */
  maxSize?: number;
  /** Called when the crop is confirmed, with the resulting blob and a suggested filename */
  onCropComplete: (blob: Blob, fileName: string) => void | Promise<void>;
  /** Called when validation fails */
  onError?: (error: string) => void;
  /** HTML id for the hidden file input (for getElementById access) */
  inputId?: string;
}

/**
 * Reusable component that handles the file-input → validation → cropper lifecycle.
 *
 * Usage:
 * ```tsx
 * const cropperRef = useRef<ImageCropperUploaderHandle>(null);
 *
 * <button onClick={() => cropperRef.current?.open()}>Select file</button>
 * <ImageCropperUploader
 *   ref={cropperRef}
 *   aspect={16/9}
 *   onCropComplete={async (blob, fileName) => { /* upload *\/ }}
 * />
 * ```
 *
 * For drag-and-drop:
 * ```tsx
 * const onDrop = (e: DragEvent) => {
 *   e.preventDefault();
 *   const file = e.dataTransfer.files[0];
 *   if (file) cropperRef.current?.processFile(file);
 * };
 * ```
 */
export const ImageCropperUploader = forwardRef<
  ImageCropperUploaderHandle,
  ImageCropperUploaderProps
>(function ImageCropperUploader(
  {
    aspect = 16 / 9,
    cropperTitle = 'Ajustar imagen',
    cropperSubtitle = 'Arrastra para encuadrar · Ratio 16:9',
    accept = 'image/jpeg,image/png,image/webp,image/gif,image/avif',
    maxSize = 10 * 1024 * 1024,
    onCropComplete,
    onError,
    inputId,
  },
  ref
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropFileUrl, setCropFileUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  // Expose open() and processFile() to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      open: () => fileInputRef.current?.click(),
      processFile: (file: File) => {
        const error = validateFile(file);
        if (error) {
          onError?.(error);
          return;
        }
        openCropper(file);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accept, maxSize]
  );

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (cropFileUrl) URL.revokeObjectURL(cropFileUrl);
    };
  }, [cropFileUrl]);

  function validateFile(file: File): string | null {
    const allowedTypes = accept.split(',').map((t) => t.trim());

    const isTypeValid = allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      // Handle partial match (e.g. 'image/jpeg' matches 'image/jpeg')
      return file.type === type;
    });

    if (!isTypeValid) {
      return 'Formato no soportado.';
    }

    if (file.size > maxSize) {
      const sizeMB = (maxSize / 1024 / 1024).toFixed(0);
      const fileMB = (file.size / 1024 / 1024).toFixed(1);
      return `Archivo demasiado grande. Máximo: ${sizeMB}MB (${fileMB}MB).`;
    }

    return null;
  }

  function openCropper(file: File) {
    setSelectedFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setCropFileUrl(objectUrl);
    setShowCropper(true);
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      onError?.(error);
      return;
    }

    openCropper(file);
  }

  async function handleCropConfirm(croppedBlob: Blob) {
    setShowCropper(false);

    // Cleanup crop URL immediately to free memory
    if (cropFileUrl) {
      URL.revokeObjectURL(cropFileUrl);
      setCropFileUrl(null);
    }

    const baseName = selectedFileName.replace(/\.[^.]+$/, '') || 'cropped';
    const fileName = `${baseName}.webp`;
    await onCropComplete(croppedBlob, fileName);
  }

  function handleCropCancel() {
    setShowCropper(false);
    if (cropFileUrl) {
      URL.revokeObjectURL(cropFileUrl);
      setCropFileUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        id={inputId}
      />
      <ImageCropper
        imageSrc={cropFileUrl || ''}
        open={showCropper}
        aspect={aspect}
        title={cropperTitle}
        subtitle={cropperSubtitle}
        onCropConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
        onError={onError}
      />
    </>
  );
});
