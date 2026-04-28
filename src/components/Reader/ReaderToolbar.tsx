'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        'bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50',
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
              'p-2 rounded-lg transition-all',
              'hover:bg-slate-700/50 text-slate-300',
              'disabled:opacity-30 disabled:cursor-not-allowed'
            )}
            title="Previous page (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Page Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-lg">
            <span className="text-sm font-medium text-white min-w-[3ch] text-center">
              {currentPage + 1}
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-sm text-slate-400">{totalPages}</span>
          </div>
          
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - (isDoublePage ? 2 : 1)}
            className={cn(
              'p-2 rounded-lg transition-all',
              'hover:bg-slate-700/50 text-slate-300',
              'disabled:opacity-30 disabled:cursor-not-allowed'
            )}
            title="Next page (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Progress Slider */}
        <div className="hidden sm:flex flex-1 max-w-md mx-4 items-center gap-3">
          <span className="text-xs text-slate-500">1</span>
          <div className="relative flex-1 h-8 flex items-center group">
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage + 1}
              onChange={handleSliderChange}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-blue-500
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-all
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-blue-500
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #334155 ${progress}%, #334155 100%)`
              }}
            />
            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs bg-slate-800 text-white px-2 py-1 rounded">
                Page {currentPage + 1}
              </span>
            </div>
          </div>
          <span className="text-xs text-slate-500">{totalPages}</span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-1 mr-2">
            <button
              onClick={() => onThemeChange('light')}
              className={cn(
                'p-1.5 rounded transition-all',
                theme === 'light' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
              )}
              title="Light theme"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => onThemeChange('dark')}
              className={cn(
                'p-1.5 rounded transition-all',
                theme === 'dark' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
              )}
              title="Dark theme"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onThemeChange('sepia')}
              className={cn(
                'p-1.5 rounded transition-all text-xs font-medium',
                theme === 'sepia' ? 'bg-amber-700 text-white' : 'text-amber-600 hover:text-amber-500'
              )}
              title="Sepia theme"
            >
              <Type className="w-4 h-4" />
            </button>
          </div>

          {/* Double Page Toggle */}
          <button
            onClick={onToggleDoublePage}
            className={cn(
              'p-2 rounded-lg transition-all',
              isDoublePage 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'hover:bg-slate-700/50 text-slate-400'
            )}
            title="Toggle double page (D)"
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
              'p-2 rounded-lg transition-all',
              isRTL 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'hover:bg-slate-700/50 text-slate-400'
            )}
            title="Toggle reading direction (R)"
          >
            <ArrowRightLeft className={cn('w-5 h-5', isRTL && 'rotate-180')} />
          </button>

          {/* Comments Toggle */}
          <button
            onClick={onToggleComments}
            className={cn(
              'p-2 rounded-lg transition-all',
              showComments 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'hover:bg-slate-700/50 text-slate-400'
            )}
            title="Toggle comments (C)"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-all"
            title="Toggle fullscreen (F)"
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
              'p-2 rounded-lg transition-all',
              settingsOpen 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'hover:bg-slate-700/50 text-slate-400'
            )}
            title="Settings (S)"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-0.5 bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
