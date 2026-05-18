'use client';

import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  LayoutGrid,
  Settings,
  Maximize,
  Minimize,
  MessageSquare,
  Type,
  Sun,
  Moon,
  ArrowRightLeft,
} from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

export interface ReaderToolbarProps {
  currentPage: number;
  totalPages: number;
  isDoublePage: boolean;
  isRTL: boolean;
  isFullscreen: boolean;
  showComments: boolean;
  settingsOpen: boolean;
  theme: 'light' | 'dark' | 'sepia';
  onPageChange: (page: number) => void;
  onToggleDoublePage: () => void;
  onToggleRTL: () => void;
  onToggleFullscreen: () => void;
  onToggleComments: () => void;
  onToggleSettings: () => void;
  onThemeChange: (theme: 'light' | 'dark' | 'sepia') => void;
  className?: string;
}

export function ReaderToolbar({
  currentPage,
  totalPages,
  isDoublePage,
  isRTL,
  isFullscreen,
  showComments,
  settingsOpen,
  theme,
  onPageChange,
  onToggleDoublePage,
  onToggleRTL,
  onToggleFullscreen,
  onToggleComments,
  onToggleSettings,
  onThemeChange,
  className,
}: ReaderToolbarProps) {
  const progress = ((currentPage + 1) / totalPages) * 100;
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPage = parseInt(e.target.value, 10) - 1;
    onPageChange(Math.max(0, Math.min(newPage, totalPages - 1)));
  };

  const handlePrevPage = () => {
    const step = isDoublePage ? 2 : 1;
    onPageChange(Math.max(0, currentPage - step));
  };

  const handleNextPage = () => {
    const step = isDoublePage ? 2 : 1;
    onPageChange(Math.min(totalPages - 1, currentPage + step));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)]/50',
        className
      )}
    >
      {/* Main Toolbar */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className={cn(
            'p-2 rounded-lg transition-all cursor-pointer',
            'hover:bg-[var(--border)]/50 text-[var(--text-secondary)]',
            'disabled:opacity-30 disabled:cursor-not-allowed'
          )}
          title="Previous page (←)"
          aria-label="Página anterior"
        >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Page Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-elevated)]/80 rounded-lg">
            <span className="text-sm font-medium text-[var(--text-inverse)] min-w-[3ch] text-center">
              {currentPage + 1}
            </span>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="text-sm text-[var(--text-tertiary)]">{totalPages}</span>
          </div>
          
        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages - (isDoublePage ? 2 : 1)}
          className={cn(
            'p-2 rounded-lg transition-all cursor-pointer',
            'hover:bg-[var(--border)]/50 text-[var(--text-secondary)]',
            'disabled:opacity-30 disabled:cursor-not-allowed'
          )}
          title="Next page (→)"
          aria-label="Página siguiente"
        >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Progress Slider */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4 items-center gap-3">
          <span className="text-xs text-[var(--text-muted)]">1</span>
          <div className="relative flex-1 h-8 flex items-center group">
          <input
            type="range"
            min={1}
            max={totalPages}
            value={currentPage + 1}
            onChange={handleSliderChange}
            aria-label="Seleccionar página"
            className="w-full h-1.5 bg-[var(--border)] rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[var(--primary)]
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-[var(--primary)]
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${progress}%, var(--border) ${progress}%, var(--border) 100%)`
              }}
            />
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs bg-[var(--surface-elevated)] text-[var(--text-inverse)] px-2 py-1 rounded">
                Page {currentPage + 1}
              </span>
            </div>
          </div>
          <span className="text-xs text-[var(--text-muted)]">{totalPages}</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <div className="flex items-center bg-[var(--surface-elevated)]/80 rounded-lg p-1 mr-2">
          <button
            onClick={() => onThemeChange('light')}
            className={cn(
              'p-1.5 rounded transition-all cursor-pointer',
              theme === 'light' ? 'bg-[var(--primary)] text-[var(--text-inverse)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-inverse)]'
            )}
            title="Light theme"
            aria-label="Tema claro"
          >
              <Sun className="w-4 h-4" />
            </button>
          <button
            onClick={() => onThemeChange('dark')}
            className={cn(
              'p-1.5 rounded transition-all cursor-pointer',
              theme === 'dark' ? 'bg-[var(--primary)] text-[var(--text-inverse)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-inverse)]'
            )}
            title="Dark theme"
            aria-label="Tema oscuro"
          >
              <Moon className="w-4 h-4" />
            </button>
          <button
            onClick={() => onThemeChange('sepia')}
            className={cn(
              'p-1.5 rounded transition-all cursor-pointer text-xs font-medium',
              theme === 'sepia' ? 'bg-[var(--warning)] text-[var(--text-inverse)]' : 'text-[var(--warning)] hover:text-[var(--warning)]'
            )}
            title="Sepia theme"
            aria-label="Tema sepia"
          >
              <Type className="w-4 h-4" />
            </button>
          </div>

          {/* Double Page Toggle */}
        <button
          onClick={onToggleDoublePage}
          className={cn(
            'p-2 rounded-lg transition-all cursor-pointer',
            isDoublePage
            ? 'bg-[var(--primary)]/20 text-[var(--info)]'
            : 'hover:bg-[var(--border)]/50 text-[var(--text-tertiary)]'
          )}
          title="Toggle double page (D)"
          aria-label="Doble página"
        >
            {isDoublePage ? (
              <LayoutGrid className="w-5 h-5" />
            ) : (
              <BookOpen className="w-5 h-5" />
            )}
          </button>

          {/* RTL Toggle */}
        <button
          onClick={onToggleRTL}
          className={cn(
            'p-2 rounded-lg transition-all cursor-pointer',
            isRTL
            ? 'bg-[var(--primary)]/20 text-[var(--info)]'
            : 'hover:bg-[var(--border)]/50 text-[var(--text-tertiary)]'
          )}
          title="Toggle reading direction (R)"
          aria-label="Dirección de lectura"
        >
            <ArrowRightLeft className={cn('w-5 h-5', isRTL && 'rotate-180')} />
          </button>

          {/* Comments Toggle */}
        <button
          onClick={onToggleComments}
          className={cn(
            'p-2 rounded-lg transition-all cursor-pointer',
            showComments
            ? 'bg-[var(--primary)]/20 text-[var(--info)]'
            : 'hover:bg-[var(--border)]/50 text-[var(--text-tertiary)]'
          )}
          title="Toggle comments (C)"
          aria-label="Comentarios"
        >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg hover:bg-[var(--border)]/50 text-[var(--text-tertiary)] transition-all cursor-pointer"
          title="Toggle fullscreen (F)"
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>

          {/* Settings */}
        <button
          onClick={onToggleSettings}
          className={cn(
            'p-2 rounded-lg transition-all cursor-pointer',
            settingsOpen
            ? 'bg-[var(--primary)]/20 text-[var(--info)]'
            : 'hover:bg-[var(--border)]/50 text-[var(--text-tertiary)]'
          )}
          title="Settings (S)"
          aria-label="Configuración"
        >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-0.5 bg-[var(--surface-elevated)]">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-blue)]"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
