'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import OptimizedImage, { OptimizedImageProps } from './OptimizedImage';

// ============================================================================
// Types
// ============================================================================

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  blurHash?: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  caption?: string;
  metadata?: {
    size?: number;
    format?: string;
    createdAt?: string;
  };
}

export interface ImageGalleryProps {
  /** Array of images to display */
  images: GalleryImage[];
  /** Layout mode */
  layout?: 'grid' | 'masonry';
  /** Number of columns (responsive)
   * Can be a number or object with breakpoints: { default: 2, sm: 3, lg: 4 }
   */
  columns?: number | Record<string, number>;
  /** Gap between images in pixels */
  gap?: number;
  /** CSS classes for container */
  className?: string;
  /** CSS classes for individual image items */
  itemClassName?: string;
  /** Enable lightbox on click */
  enableLightbox?: boolean;
  /** Show image info in lightbox */
  showInfo?: boolean;
  /** Lazy loading threshold */
  lazyOffset?: string;
  /** Callback when image is clicked */
  onImageClick?: (image: GalleryImage, index: number) => void;
  /** Callback when lightbox opens */
  onLightboxOpen?: (image: GalleryImage, index: number) => void;
  /** Callback when lightbox closes */
  onLightboxClose?: () => void;
}

interface LightboxProps {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  showInfo?: boolean;
}

// ============================================================================
// Lightbox Component
// ============================================================================

function Lightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  showInfo = true,
}: LightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [showMetadata, setShowMetadata] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentImage = images[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) onNavigate(currentIndex - 1);
          break;
        case 'ArrowRight':
          if (currentIndex < images.length - 1) onNavigate(currentIndex + 1);
          break;
        case '+':
        case '=':
          setZoom((prev) => Math.min(prev + 0.25, 3));
          break;
        case '-':
          setZoom((prev) => Math.max(prev - 0.25, 0.5));
          break;
        case '0':
          setZoom(1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose, onNavigate]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset zoom when image changes
  useEffect(() => {
    setZoom(1);
  }, [currentIndex]);

  if (!isOpen || !currentImage) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage.src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${currentImage.id}.${blob.type.split('/')[1] || 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-[var(--text-inverse)]/70 hover:text-[var(--text-inverse)] bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        aria-label="Cerrar"
      >
        <X size={24} />
      </button>

      {/* Top controls */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <span className="text-[var(--text-inverse)]/70 text-sm bg-black/50 px-3 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </span>
        {showInfo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMetadata(!showMetadata);
            }}
            className="p-2 text-[var(--text-inverse)]/70 hover:text-[var(--text-inverse)] bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            aria-label="Información"
          >
            <Info size={20} />
          </button>
        )}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/50 rounded-full p-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="p-2 text-[var(--text-inverse)]/70 hover:text-[var(--text-inverse)] hover:opacity-90 rounded-full transition-colors"
          aria-label="Alejar"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomReset();
          }}
          className="px-3 text-[var(--text-inverse)]/70 hover:text-[var(--text-inverse)] text-sm font-medium"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="p-2 text-[var(--text-inverse)]/70 hover:text-[var(--text-inverse)] hover:opacity-90 rounded-full transition-colors"
          aria-label="Acercar"
        >
          <ZoomIn size={20} />
        </button>
      </div>

      {/* Download button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        className="absolute bottom-4 right-4 z-50 p-2 text-[var(--text-inverse)]/70 hover:text-[var(--text-inverse)] bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        aria-label="Descargar"
      >
        <Download size={20} />
      </button>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 text-[var(--text-inverse)]/70 hover:text-[var(--text-inverse)] bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft size={32} />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 text-[var(--text-inverse)]/70 hover:text-[var(--text-inverse)] bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          aria-label="Siguiente"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Image container */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4 md:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Caption */}
      {currentImage.caption && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-2xl text-center">
          <p className="text-[var(--text-inverse)]/80 text-sm bg-black/50 px-4 py-2 rounded-lg">
            {currentImage.caption}
          </p>
        </div>
      )}

      {/* Metadata panel */}
      {showMetadata && showInfo && currentImage.metadata && (
        <div
          className="absolute top-16 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-[var(--text-inverse)]/80 text-sm min-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="font-semibold mb-2">Información</h4>
          {currentImage.metadata.size && (
            <p>Tamaño: {(currentImage.metadata.size / 1024 / 1024).toFixed(2)} MB</p>
          )}
          {currentImage.metadata.format && (
            <p>Formato: {currentImage.metadata.format.toUpperCase()}</p>
          )}
          {currentImage.width && currentImage.height && (
            <p>Dimensiones: {currentImage.width} x {currentImage.height}</p>
          )}
          {currentImage.metadata.createdAt && (
            <p>Creado: {new Date(currentImage.metadata.createdAt).toLocaleDateString()}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Gallery Component
// ============================================================================

export function ImageGallery({
  images,
  layout = 'masonry',
  columns = { default: 2, sm: 3, md: 3, lg: 4, xl: 5 },
  gap = 16,
  className = '',
  itemClassName = '',
  enableLightbox = true,
  showInfo = true,
  lazyOffset = '200px',
  onImageClick,
  onLightboxOpen,
  onLightboxClose,
}: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle image click
  const handleImageClick = useCallback(
    (image: GalleryImage, index: number) => {
      onImageClick?.(image, index);
      if (enableLightbox) {
        setCurrentIndex(index);
        setLightboxOpen(true);
        onLightboxOpen?.(image, index);
      }
    },
    [enableLightbox, onImageClick, onLightboxOpen]
  );

  // Handle lightbox close
  const handleLightboxClose = useCallback(() => {
    setLightboxOpen(false);
    onLightboxClose?.();
  }, [onLightboxClose]);

  // Handle navigation
  const handleNavigate = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Generate columns class based on responsive config
  const columnsClass = useMemo(() => {
    if (typeof columns === 'number') {
      return `grid-cols-${columns}`;
    }

    const classes: string[] = [];
    Object.entries(columns).forEach(([breakpoint, count]) => {
      if (breakpoint === 'default') {
        classes.push(`grid-cols-${count}`);
      } else {
        classes.push(`${breakpoint}:grid-cols-${count}`);
      }
    });
    return classes.join(' ');
  }, [columns]);

  // Grid layout
  if (layout === 'grid') {
    return (
      <>
        <div
          ref={containerRef}
          className={cn('grid', columnsClass, className)}
          style={{ gap: `${gap}px` }}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                'relative aspect-[3/4] overflow-hidden rounded-lg cursor-pointer group',
                itemClassName
              )}
              onClick={() => handleImageClick(image, index)}
            >
              <OptimizedImage
                src={image.thumbnailUrl || image.src}
                alt={image.alt}
                fill
                blurHash={image.blurHash}
                loading={index < 6 ? 'eager' : 'lazy'}
                className="transition-transform duration-300 group-hover:scale-105"
              />
              {image.caption && (
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[var(--text-inverse)] text-sm truncate">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {enableLightbox && (
          <Lightbox
            images={images}
            currentIndex={currentIndex}
            isOpen={lightboxOpen}
            onClose={handleLightboxClose}
            onNavigate={handleNavigate}
            showInfo={showInfo}
          />
        )}
      </>
    );
  }

  // Masonry layout
  const columnsArray = useMemo(() => {
    const colCount = typeof columns === 'number' ? columns : columns.default || 2;
    const cols: GalleryImage[][] = Array.from({ length: colCount }, () => []);
    images.forEach((image, index) => {
      cols[index % colCount].push(image);
    });
    return cols;
  }, [images, columns]);

  return (
    <>
      <div
        ref={containerRef}
        className={cn('grid', columnsClass, className)}
        style={{ gap: `${gap}px` }}
      >
        {columnsArray.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col" style={{ gap: `${gap}px` }}>
            {column.map((image, index) => {
              const globalIndex = colIndex + index * columnsArray.length;
              return (
                <div
                  key={image.id}
                  className={cn(
                    'relative overflow-hidden rounded-lg cursor-pointer group',
                    itemClassName
                  )}
                  onClick={() => handleImageClick(image, globalIndex)}
                >
                  <OptimizedImage
                    src={image.thumbnailUrl || image.src}
                    alt={image.alt}
                    width={image.width || 400}
                    height={image.height || 600}
                    blurHash={image.blurHash}
                    loading={globalIndex < 6 ? 'eager' : 'lazy'}
                    className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                  />
                  {image.caption && (
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[var(--text-inverse)] text-sm">{image.caption}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {enableLightbox && (
        <Lightbox
          images={images}
          currentIndex={currentIndex}
          isOpen={lightboxOpen}
          onClose={handleLightboxClose}
          onNavigate={handleNavigate}
          showInfo={showInfo}
        />
      )}
    </>
  );
}

// ============================================================================
// Export variants
// ============================================================================

/**
 * Simple image grid variant
 */
export function ImageGrid(props: Omit<ImageGalleryProps, 'layout'>) {
  return <ImageGallery {...props} layout="grid" />;
}

/**
 * Masonry image layout variant
 */
export function ImageMasonry(props: Omit<ImageGalleryProps, 'layout'>) {
  return <ImageGallery {...props} layout="masonry" />;
}

export default ImageGallery;
