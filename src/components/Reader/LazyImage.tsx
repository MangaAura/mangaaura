'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  index: number;
  isCurrent: boolean;
  onLoad?: () => void;
  className?: string;
  fitMode?: 'width' | 'height' | 'screen' | 'original';
}

export function LazyImage({
  src,
  alt,
  index,
  isCurrent,
  onLoad,
  className,
  fitMode = 'width',
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Preload current and adjacent images
  useEffect(() => {
    if (isCurrent && imageRef.current) {
      imageRef.current.loading = 'eager';
    }
  }, [isCurrent]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const getFitStyles = () => {
    switch (fitMode) {
      case 'width':
        return 'max-w-full h-auto';
      case 'height':
        return 'max-h-full w-auto';
      case 'screen':
        return 'max-w-full max-h-full object-contain';
      case 'original':
        return 'w-auto h-auto';
      default:
        return 'max-w-full h-auto';
    }
  };

  return (
    <motion.div
      ref={imgRef}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{
        opacity: isLoaded ? 1 : 0.3,
        scale: isLoaded ? 1 : 0.98,
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden',
        'bg-[var(--surface-sunken)]',
        className
      )}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-16 h-20 bg-[var(--bg-tertiary)] rounded" />
          <span className="text-xs text-[var(--text-tertiary)]">Loading...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
          <span className="text-[var(--text-tertiary)] text-sm">Failed to load</span>
          <button
            onClick={() => {
              setHasError(false);
              setIsLoaded(false);
            }}
            className="block mt-2 text-xs text-[var(--accent-blue)] hover:opacity-80 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={isCurrent ? 'eager' : 'lazy'}
          className={cn(
            'transition-opacity duration-300',
            getFitStyles(),
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      )}

      {/* Page number indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        className="absolute bottom-2 right-2 bg-black/50 text-[var(--text-inverse)] text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity"
      >
        {index + 1}
      </motion.div>
    </motion.div>
  );
}

// Component for double page spread
interface DoublePageImageProps {
  leftSrc: string;
  rightSrc: string;
  leftIndex: number;
  rightIndex: number;
  isRTL: boolean;
  onLoad?: () => void;
  className?: string;
}

export function DoublePageImage({
  leftSrc,
  rightSrc,
  leftIndex,
  rightIndex,
  isRTL,
  onLoad,
  className,
}: DoublePageImageProps) {
  const [loadedCount, setLoadedCount] = useState(0);
  const isLoaded = loadedCount >= 2;

  const handleLoad = () => {
    setLoadedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 2) {
        onLoad?.();
      }
      return newCount;
    });
  };

  return (
    <div 
      className={cn(
        'flex items-start justify-center gap-1',
        isRTL && 'flex-row-reverse',
        className
      )}
    >
      <LazyImage
        src={leftSrc}
        alt={`Page ${leftIndex + 1}`}
        index={leftIndex}
        isCurrent={true}
        onLoad={handleLoad}
        className="max-w-[50%]"
      />
      <LazyImage
        src={rightSrc}
        alt={`Page ${rightIndex + 1}`}
        index={rightIndex}
        isCurrent={true}
        onLoad={handleLoad}
        className="max-w-[50%]"
      />
    </div>
  );
}
