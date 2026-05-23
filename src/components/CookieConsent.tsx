'use client';

import { Cookie, Settings, X } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useT } from '@/i18n';

const COOKIE_CONSENT_KEY = 'mangaaura-cookie-consent';

type ConsentLevel = 'all' | 'necessary' | null;

export function CookieConsent() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = async (level: ConsentLevel) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, level || 'necessary');
    setVisible(false);

    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'COOKIES',
          version: '1.0',
          metadata: { level },
        }),
      });
    } catch {
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-2xl mx-auto p-6 shadow-2xl border-[var(--border-strong)]">
        {!showConfig ? (
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
              <Cookie className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                {t('cookie.title') || 'Uso de cookies'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {t('cookie.description') || 'Usamos cookies para mejorar tu experiencia. Puedes configurarlas o aceptarlas todas.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => accept('all')}>
                  {t('cookie.acceptAll') || 'Aceptar todas'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => accept('necessary')}>
                  {t('cookie.onlyNecessary') || 'Solo necesarias'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowConfig(true)}>
                  <Settings className="w-4 h-4 mr-1" />
                  {t('cookie.configure') || 'Configurar'}
                </Button>
              </div>
            </div>
            <button
              onClick={() => accept('necessary')}
              className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">
                {t('cookie.preferences') || 'Preferencias de cookies'}
              </h3>
              <button
                onClick={() => setShowConfig(false)}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                aria-label="Volver"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <label className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-sunken)]">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {t('cookie.necessary') || 'Cookies necesarias'}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {t('cookie.necessaryDesc') || 'Necesarias para el funcionamiento básico del sitio'}
                  </p>
                </div>
                <div className="w-9 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-white translate-x-2" />
                </div>
              </label>
              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--surface-sunken)] transition-colors cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {t('cookie.analytics') || 'Cookies de análisis'}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {t('cookie.analyticsDesc') || 'Nos ayudan a mejorar el sitio'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  name="analytics-cookies"
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)]"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => accept('all')}>
                {t('cookie.save') || 'Guardar preferencias'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
