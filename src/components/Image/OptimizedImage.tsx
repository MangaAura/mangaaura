'use client';

import Image from 'next/image';
import React, { useState, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'full';

export interface OptimizedImageProps {
  /** Image URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Width (for layout) */
  width?: number;
  /** Height (for layout) */
  height?: number;
  /** Fill container */
  fill?: boolean;
  /** CSS classes */
  className?: string;
  /** Image sizes attribute for srcset */
  sizes?: string;
  /** Blur hash for placeholder */
  blurHash?: string;
  /** Blur hash dimensions */
  blurHashWidth?: number;
  /** Blur hash height */
  blurHashHeight?: number;
  /** Blur data URL for placeholder */
  blurDataURL?: string;
  /** Loading strategy */
  loading?: 'eager' | 'lazy';
  /** Priority loading */
  priority?: boolean;
  /** Object fit */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Object position */
  objectPosition?: string;
  /** Callback when image loads */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Callback when image is clicked */
  onClick?: (e: React.MouseEvent) => void;
  /** Enable fallback to original URL on error */
  fallbackOnError?: boolean;
  /** Whether to use optimized variants */
  optimized?: boolean;
  /** Additional props */
  [key: string]: unknown;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BLURHASH_WIDTH = 32;
const DEFAULT_BLURHASH_HEIGHT = 32;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a simple blur data URL placeholder
 * Creates a SVG-based placeholder with a gradient
 */
function generateBlurDataURL(
  hash?: string,
  width: number = DEFAULT_BLURHASH_WIDTH,
  height: number = DEFAULT_BLURHASH_HEIGHT
): string {
  try {
    // Generate a simple gradient placeholder based on hash or random
    const baseColor = hash ? hash.charCodeAt(0) % 255 : Math.floor(Math.random() * 200);
    const color1 = `rgb(${baseColor}, ${baseColor + 20}, ${baseColor + 40})`;
    const color2 = `rgb(${baseColor + 30}, ${baseColor + 50}, ${baseColor + 70})`;
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${color1}"/>
          <stop offset="100%" stop-color="${color2}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch {
    console.error('Error generating SVG placeholder');
    return '';
  }
}

// ============================================================================
// Component
// ============================================================================

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  sizes: customSizes,
  blurHash,
  blurHashWidth = DEFAULT_BLURHASH_WIDTH,
  blurHashHeight = DEFAULT_BLURHASH_HEIGHT,
  blurDataURL: customBlurDataURL,
  loading = 'lazy',
  priority = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError,
  onClick,
  fallbackOnError = true,
  optimized = true,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate blur data URL from hash
  const blurDataURL = useMemo(() => {
    if (customBlurDataURL) return customBlurDataURL;
    if (blurHash && typeof window !== 'undefined') {
      return generateBlurDataURL(blurHash, blurHashWidth, blurHashHeight);
    }
    return undefined;
  }, [blurHash, blurHashWidth, blurHashHeight, customBlurDataURL]);

  // Default sizes attribute if not provided
  const sizes = customSizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // Handle load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // Handle error - fallback to original
  const handleError = useCallback(() => {
    if (fallbackOnError && !hasError) {
      setHasError(true);
    }
    onError?.();
  }, [fallbackOnError, hasError, onError]);

  // Determine image source
  const imageSrc = hasError ? src : src;

  // Style for object fit
  const objectFitClass = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }[objectFit];

  return (
    <div
      className={`
        relative overflow-hidden
        ${fill ? 'absolute inset-0' : ''}
        ${className}
      `}
      style={!fill ? { width, height } : undefined}
      onClick={onClick}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={`
          transition-opacity duration-300
          ${objectFitClass}
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${objectPosition ? `[object-position:${objectPosition}]` : ''}
        `}
        style={{ objectPosition }}
        loading={loading}
        priority={priority}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        sizes={sizes}
        {...props}
      />
      
      {/* Loading state */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 animate-pulse bg-[var(--bg-tertiary)]"
          aria-hidden="true"
        />
      )}
      
      {/* Error state indicator */}
      {hasError && (
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-sunken)]">
        <span className="text-[var(--text-tertiary)] text-sm">Error al cargar</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Export variants
// ============================================================================

/**
 * Thumbnail variant
 */
export function ThumbnailImage(props: OptimizedImageProps) {
  const { width, height, ...rest } = props;
  return (
    <OptimizedImage
      {...rest}
      width={200}
      height={200}
      sizes="200px"
      loading="lazy"
    />
  );
}

/**
 * Cover image variant
 */
export function CoverImage(props: OptimizedImageProps) {
  const { fill, ...rest } = props;
  return (
    <OptimizedImage
      {...rest}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      loading="lazy"
      objectFit="cover"
    />
  );
}

export default OptimizedImage;
