'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sun,
  Contrast,
  Coffee,
  Maximize,
  Minimize,
  Monitor,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReaderSettings {
  brightness: number;
  contrast: number;
  sepia: number;
  fitMode: 'width' | 'height' | 'screen' | 'original';
  gap: number;
}

interface ReaderSettingsPanelProps {
  isOpen: boolean;
  settings: ReaderSettings;
  onClose: () => void;
  onSettingsChange: (settings: Partial<ReaderSettings>) => void;
  onReset: () => void;
}

export function ReaderSettingsPanel({
  isOpen,
  settings,
  onClose,
  onSettingsChange,
  onReset,
}: ReaderSettingsPanelProps) {
  const fitModes: { value: ReaderSettings['fitMode']; label: string; icon: React.ReactNode }[] = [
    { value: 'width', label: 'Fit Width', icon: <Maximize className="w-4 h-4 rotate-90" /> },
    { value: 'height', label: 'Fit Height', icon: <Minimize className="w-4 h-4" /> },
    { value: 'screen', label: 'Fit Screen', icon: <Monitor className="w-4 h-4" /> },
    { value: 'original', label: 'Original', icon: <Sun className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed right-0 top-0 bottom-0 w-80 z-50',
              'bg-slate-900 border-l border-slate-700/50',
              'shadow-2xl overflow-y-auto'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white">Reader Settings</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={onReset}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Reset to defaults"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Fit Mode */}
              <section>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Fit Mode
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {fitModes.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => onSettingsChange({ fitMode: mode.value })}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                        settings.fitMode === mode.value
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      {mode.icon}
                      <span className="text-xs">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Brightness */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    Brightness
                  </h3>
                  <span className="text-xs text-slate-500">{settings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={settings.brightness}
                  onChange={(e) => onSettingsChange({ brightness: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-blue-500
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-blue-500
                    [&::-moz-range-thumb]:border-0"
                />
              </section>

              {/* Contrast */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Contrast className="w-4 h-4" />
                    Contrast
                  </h3>
                  <span className="text-xs text-slate-500">{settings.contrast}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={settings.contrast}
                  onChange={(e) => onSettingsChange({ contrast: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-blue-500
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-blue-500
                    [&::-moz-range-thumb]:border-0"
                />
              </section>

              {/* Sepia */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Coffee className="w-4 h-4" />
                    Sepia
                  </h3>
                  <span className="text-xs text-slate-500">{settings.sepia}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.sepia}
                  onChange={(e) => onSettingsChange({ sepia: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-amber-500
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-amber-500
                    [&::-moz-range-thumb]:border-0"
                  style={{
                    background: `linear-gradient(to right, #78350f 0%, #f59e0b ${settings.sepia}%, #334155 ${settings.sepia}%, #334155 100%)`
                  }}
                />
              </section>

              {/* Page Gap */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-300">
                    Page Gap
                  </h3>
                  <span className="text-xs text-slate-500">{settings.gap}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={settings.gap}
                  onChange={(e) => onSettingsChange({ gap: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-blue-500
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-blue-500
                    [&::-moz-range-thumb]:border-0"
                />
              </section>

              {/* Preview */}
              <section className="pt-4 border-t border-slate-700/50">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Preview</h3>
                <div 
                  className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-800"
                  style={{
                    filter: `
                      brightness(${settings.brightness}%)
                      contrast(${settings.contrast}%)
                      sepia(${settings.sepia}%)
                    `,
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-3/4 h-3/4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const defaultReaderSettings: ReaderSettings = {
  brightness: 100,
  contrast: 100,
  sepia: 0,
  fitMode: 'width',
  gap: 8,
};
