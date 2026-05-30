'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyImageOptions {
  src: string;
  placeholderSrc?: string;
  rootMargin?: string;
  threshold?: number;
  preloadNext?: boolean;
}

interface UseLazyImageReturn {
  imgRef: React.RefObject<HTMLImageElement | null>;
  isLoaded: boolean;
  isInView: boolean;
  currentSrc: string;
  blurUrl: string | null;
}

export function useLazyImage({
  src,
  placeholderSrc,
  rootMargin = '50px',
  threshold = 0.1,
  preloadNext = true,
}: UseLazyImageOptions): UseLazyImageReturn {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [blurUrl, setBlurUrl] = useState<string | null>(null);

  // Generate blur placeholder
  useEffect(() => {
    if (!placeholderSrc) {
      // Create a tiny blur placeholder
      const canvas = document.createElement('canvas');
      canvas.width = 20;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 20, 30);
        const url = canvas.toDataURL();
        if (url !== blurUrl) setBlurUrl(url);
      }
    } else {
      if (placeholderSrc !== blurUrl) setBlurUrl(placeholderSrc);
    }
  }, [placeholderSrc, blurUrl]);

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
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (isInView) {
      img.src = src;
      img.addEventListener('load', handleLoad);
      
      return () => {
        img.removeEventListener('load', handleLoad);
      };
    }
  }, [isInView, src, handleLoad]);

  // Preload next image
  useEffect(() => {
    if (preloadNext && isLoaded) {
      // This will be handled by the parent component
    }
  }, [isLoaded, preloadNext]);

  return {
    imgRef,
    isLoaded,
    isInView,
    currentSrc: isInView ? src : blurUrl || '',
    blurUrl,
  };
}

// Hook for preloading images
export function useImagePreloader() {
  const preloadedImages = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (preloadedImages.current.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        preloadedImages.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadNextImages = useCallback(async (
    currentIndex: number,
    images: string[],
    count: number = 2
  ) => {
    const nextImages = images.slice(currentIndex + 1, currentIndex + 1 + count);
    await Promise.all(nextImages.map(preloadImage));
  }, [preloadImage]);

  return { preloadImage, preloadNextImages, preloadedImages };
}
