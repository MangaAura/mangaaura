'use client';

import { Minimize2, Contrast, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function AccessibilitySettings() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [focusRing, setFocusRing] = useState<'thin' | 'normal' | 'thick'>('normal');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const savedMotion = localStorage.getItem('a11y_reducedMotion');
    const savedContrast = localStorage.getItem('a11y_highContrast');
    const savedFocus = localStorage.getItem('a11y_focusRing') as 'thin' | 'normal' | 'thick' | null;

    if (savedMotion === 'true') setReducedMotion(true);
    if (savedContrast === 'true') setHighContrast(true);
    if (savedFocus) setFocusRing(savedFocus);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-reduced-motion', reducedMotion);
    localStorage.setItem('a11y_reducedMotion', String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    document.documentElement.classList.toggle('a11y-high-contrast', highContrast);
    localStorage.setItem('a11y_highContrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--a11y-focus-ring-width',
      focusRing === 'thin' ? '1px' : focusRing === 'thick' ? '4px' : '2px'
    );
    localStorage.setItem('a11y_focusRing', focusRing);
  }, [focusRing]);

  const handleSave = () => {
    setIsDirty(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Accesibilidad</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Personaliza la experiencia visual y de navegación
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-sunken)]">
          <div className="flex items-start gap-3">
            <Minimize2 className="w-5 h-5 text-[var(--text-secondary)] mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-[var(--text-primary)]">Movimiento reducido</p>
              <p className="text-sm text-[var(--text-secondary)]">Reduce las animaciones y transiciones</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={reducedMotion}
            aria-label="Movimiento reducido"
            onClick={() => { setReducedMotion(!reducedMotion); setIsDirty(true); }}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors cursor-pointer',
              reducedMotion ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                reducedMotion && 'translate-x-5'
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-sunken)]">
          <div className="flex items-start gap-3">
            <Contrast className="w-5 h-5 text-[var(--text-secondary)] mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-[var(--text-primary)]">Alto contraste</p>
              <p className="text-sm text-[var(--text-secondary)]">Aumenta el contraste de colores para mejorar la legibilidad</p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={highContrast}
            aria-label="Alto contraste"
            onClick={() => { setHighContrast(!highContrast); setIsDirty(true); }}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors cursor-pointer',
              highContrast ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
                highContrast && 'translate-x-5'
              )}
            />
          </button>
        </div>

        <div className="p-4 rounded-lg bg-[var(--surface-sunken)]">
          <div className="flex items-start gap-3 mb-4">
            <Navigation className="w-5 h-5 text-[var(--text-secondary)] mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-[var(--text-primary)]">Anillo de enfoque</p>
              <p className="text-sm text-[var(--text-secondary)]">Tamaño del borde de enfoque al navegar con teclado</p>
            </div>
          </div>
          <div className="flex gap-2">
            {(['thin', 'normal', 'thick'] as const).map((size) => (
              <button
                key={size}
                onClick={() => { setFocusRing(size); setIsDirty(true); }}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all cursor-pointer',
                  focusRing === size
                    ? 'border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                )}
              >
                {size === 'thin' ? 'Fino' : size === 'thick' ? 'Grueso' : 'Normal'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-[var(--border)]">
        <Button onClick={handleSave} disabled={!isDirty}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
