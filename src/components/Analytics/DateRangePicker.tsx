/**
 * DateRangePicker Component
 *
 * Selector de rango de fechas con presets y selección personalizada.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';

export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  /** Valor actual del rango */
  value: DateRange;
  /** Preset actualmente seleccionado */
  preset?: DateRangePreset;
  /** Callback al cambiar el rango */
  onChange: (range: DateRange, preset: DateRangePreset) => void;
  /** Clases adicionales */
  className?: string;
  /** Deshabilitar presets específicos */
  disabledPresets?: DateRangePreset[];
}

interface PresetOption {
  value: DateRangePreset;
  label: string;
  days: number;
}

const PRESETS: PresetOption[] = [
  { value: '7d', label: 'Últimos 7 días', days: 7 },
  { value: '30d', label: 'Últimos 30 días', days: 30 },
  { value: '90d', label: 'Últimos 90 días', days: 90 },
  { value: 'custom', label: 'Personalizado', days: 0 },
];

function getPresetRange(days: number): DateRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  return { from, to };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function DateRangePicker({
  value,
  preset = '30d',
  onChange,
  className,
  disabledPresets = [],
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(formatDateInput(value.from));
  const [customTo, setCustomTo] = useState(formatDateInput(value.to));

  const activePreset = PRESETS.find((p) => p.value === preset);

  const displayLabel = useMemo(() => {
    if (preset === 'custom') {
      return `${formatDate(value.from)} - ${formatDate(value.to)}`;
    }
    return activePreset?.label ?? 'Seleccionar período';
  }, [preset, activePreset, value]);

  const handlePresetSelect = useCallback(
    (selectedPreset: DateRangePreset) => {
      if (selectedPreset === 'custom') {
        onChange(
          {
            from: new Date(customFrom),
            to: new Date(customTo),
          },
          selectedPreset
        );
      } else {
        const days = PRESETS.find((p) => p.value === selectedPreset)?.days ?? 30;
        onChange(getPresetRange(days), selectedPreset);
      }
      setIsOpen(false);
    },
    [customFrom, customTo, onChange]
  );

  const handleCustomDateChange = useCallback(
    (type: 'from' | 'to', dateValue: string) => {
      if (type === 'from') {
        setCustomFrom(dateValue);
      } else {
        setCustomTo(dateValue);
      }
    },
    []
  );

  const applyCustomRange = useCallback(() => {
    const from = new Date(customFrom);
    const to = new Date(customTo);
    to.setHours(23, 59, 59, 999);
    onChange({ from, to }, 'custom');
    setIsOpen(false);
  }, [customFrom, customTo, onChange]);

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border',
          'bg-white border-slate-200 text-slate-700',
          'hover:border-slate-300 hover:bg-slate-50',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
          'transition-all duration-200',
          isOpen && 'border-indigo-500 ring-2 ring-indigo-500/20'
        )}
      >
        <CalendarIcon className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium">{displayLabel}</span>
        <ChevronDownIcon
          className={cn(
            'w-4 h-4 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-lg z-50 p-2">
            {/* Presets */}
            <div className="space-y-1">
              {PRESETS.filter((p) => !disabledPresets.includes(p.value)).map(
                (presetOption) => (
                  <button
                    key={presetOption.value}
                    onClick={() => handlePresetSelect(presetOption.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm',
                      'transition-colors duration-150',
                      preset === presetOption.value
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <span>{presetOption.label}</span>
                    {preset === presetOption.value && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </button>
                )
              )}
            </div>

            {/* Custom Date Inputs */}
            <div
              className={cn(
                'mt-3 pt-3 border-t border-slate-100',
                preset !== 'custom' && 'opacity-50 pointer-events-none'
              )}
            >
              <p className="text-xs font-medium text-slate-500 mb-2 px-1">
                Rango personalizado
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 w-12">Desde</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => handleCustomDateChange('from', e.target.value)}
                    max={customTo}
                    className={cn(
                      'flex-1 px-2 py-1.5 text-sm rounded-lg border',
                      'border-slate-200 text-slate-700',
                      'focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 w-12">Hasta</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => handleCustomDateChange('to', e.target.value)}
                    min={customFrom}
                    max={formatDateInput(new Date())}
                    className={cn(
                      'flex-1 px-2 py-1.5 text-sm rounded-lg border',
                      'border-slate-200 text-slate-700',
                      'focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20'
                    )}
                  />
                </div>
              </div>
              <button
                onClick={applyCustomRange}
                className={cn(
                  'w-full mt-3 py-2 rounded-lg text-sm font-medium',
                  'bg-indigo-600 text-white',
                  'hover:bg-indigo-700 active:bg-indigo-800',
                  'transition-colors duration-150'
                )}
              >
                Aplicar rango
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DateRangePicker;
