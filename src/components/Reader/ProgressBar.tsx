'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/Image/OptimizedImage';

interface ChapterInfo {
  id: string;
  number: number;
  title: string;
  totalPages: number;
}

interface ProgressBarProps {
  currentPage: number;
  totalPages: number;
  currentChapter: ChapterInfo;
  chapters: ChapterInfo[];
  onPageChange: (page: number) => void;
  onChapterChange: (chapterId: string) => void;
  pageUrls: string[];
  isVisible: boolean;
  theme: 'light' | 'dark' | 'sepia';
}

export function ProgressBar({
  currentPage,
  totalPages,
  currentChapter,
  chapters,
  onPageChange,
  onChapterChange,
  pageUrls,
  isVisible,
  theme,
}: ProgressBarProps) {
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = ((currentPage + 1) / totalPages) * 100;

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return 'bg-[var(--surface)]/90 border-[var(--border)] text-[var(--text-primary)]';
      case 'sepia':
        return 'bg-[#f4ecd8]/90 border-[#d4c5a8] text-[#5c4b37]';
      default:
        return 'bg-[var(--surface)]/90 border-[var(--border)] text-[var(--text-primary)]';
    }
  };

  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newPage = Math.floor(percentage * totalPages);
    onPageChange(Math.max(0, Math.min(newPage, totalPages - 1)));
  }, [totalPages, onPageChange]);

  const handleBarHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const page = Math.floor(percentage * totalPages);
    setHoveredPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'backdrop-blur-md border-t',
        getThemeClasses()
      )}
    >
      {/* Chapter Navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Chapter {currentChapter.number}</span>
          {currentChapter.title && (
            <span className="text-sm opacity-60 truncate max-w-[200px]">
              {currentChapter.title}
            </span>
          )}
        </div>
        
        {/* Quick Chapter Navigation */}
        <div className="flex items-center gap-1">
          {chapters.slice(0, 5).map((ch) => (
            <button
              key={ch.id}
              onClick={() => onChapterChange(ch.id)}
              className={cn(
                'px-2 py-1 text-xs rounded transition-all',
                ch.id === currentChapter.id
? 'bg-[var(--primary)] text-[var(--text-inverse)]'
            : 'hover:bg-[var(--border)]/30'
              )}
            >
              {ch.number}
            </button>
          ))}
          {chapters.length > 5 && (
            <span className="text-xs opacity-50 px-1">...</span>
          )}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div 
        className="relative px-4 py-3 cursor-pointer group"
        onClick={handleBarClick}
        onMouseMove={handleBarHover}
        onMouseLeave={() => setHoveredPage(null)}
      >
        {/* Background Track */}
        <div className="h-2 bg-[var(--border)]/30 rounded-full overflow-hidden">
          {/* Progress Fill */}
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--info)]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
          
          {/* Buffered/Loaded Sections (simulated) */}
          <div 
            className="absolute top-3 h-2 bg-[var(--text-inverse)]/10 rounded-full pointer-events-none"
            style={{ 
              left: '1rem',
              width: `${Math.min(100, ((currentPage + 3) / totalPages) * 100)}%`
            }}
          />
        </div>

        {/* Hover Preview */}
        <AnimatePresence>
          {hoveredPage !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={cn(
                'absolute bottom-full mb-2 transform -translate-x-1/2',
                'bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-2xl',
                'overflow-hidden z-50'
              )}
              style={{
                left: `${((hoveredPage + 1) / totalPages) * 100}%`,
              }}
            >
              {pageUrls[hoveredPage] && (
                <>
                  <OptimizedImage
                    src={pageUrls[hoveredPage]}
                    alt={`Page ${hoveredPage + 1}`}
                    width={128}
                    height={171}
                    className="w-32 h-auto object-cover"
                  />
                  <div className="px-2 py-1 text-center text-xs text-[var(--text-primary)] bg-[var(--surface)]">
                    Page {hoveredPage + 1}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Indicators */}
        <div className="absolute top-3 left-4 right-4 h-2 pointer-events-none">
          {Array.from({ length: Math.min(totalPages, 20) }).map((_, i) => {
            const pageIndex = Math.floor((i / 20) * totalPages);
            const position = ((pageIndex + 1) / totalPages) * 100;
            return (
              <div
                key={`marker-${i}`}
                className={cn(
                  'absolute w-0.5 h-full bg-[var(--text-inverse)]/20',
                  pageIndex <= currentPage && 'bg-[var(--text-inverse)]/40'
                )}
                style={{ left: `${position}%` }}
              />
            );
          })}
        </div>

        {/* Current Page Indicator */}
        <motion.div
          className="absolute top-1.5 w-4 h-4 bg-[var(--text-inverse)] border-2 border-[var(--accent-blue)] rounded-full shadow-lg pointer-events-none"
          style={{ left: `calc(${progress}% + 1rem - 8px)` }}
          layoutId="pageIndicator"
        />
      </div>

      {/* Expanded View Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-1 text-xs text-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        aria-label={isExpanded ? 'Ocultar miniaturas' : 'Mostrar miniaturas'}
      >
        {isExpanded ? 'Hide thumbnails' : 'Show all thumbnails'}
      </button>

      {/* Thumbnail Grid (Expanded) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1">
                {pageUrls.map((url, index) => (
                  <button
                    key={`page-thumb-${index}`}
                    onClick={() => onPageChange(index)}
                    className={cn(
                      'relative aspect-[3/4] rounded overflow-hidden',
                      'transition-all duration-200',
                      index === currentPage
                        ? 'ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--surface)]'
                        : 'opacity-60 hover:opacity-100'
                    )}
                  >
                    <OptimizedImage
                      src={url}
                      alt={`Page ${index + 1}`}
                      fill
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] bg-black/50 text-[var(--text-inverse)] py-0.5">
                      {index + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FloatingProgressIndicator({
  currentPage,
  totalPages,
  className,
}: {
  currentPage: number;
  totalPages: number;
  className?: string;
}) {
  const progress = ((currentPage + 1) / totalPages) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-30',
        'px-4 py-2 rounded-full',
        'bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)]/50',
        'text-[var(--text-primary)] text-sm font-medium shadow-lg',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span>{currentPage + 1}</span>
        <div className="w-24 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[var(--text-tertiary)]">{totalPages}</span>
      </div>
    </motion.div>
  );
}
