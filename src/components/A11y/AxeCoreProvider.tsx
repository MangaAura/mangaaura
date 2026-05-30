'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Provedor de accesibilidad para desarrollo.
 *
 * Usa axe-core directamente (en vez de @axe-core/react, que es
 * incompatible con React 19 por su monkey-patching de createElement).
 *
 * - Ejecuta un audit WCAG 2.2 AA completo al cargar la página
 * - Observa cambios en el DOM vía MutationObserver con debounce de 2s
 * - Se re-ejecuta automáticamente al navegar (cambio de ruta)
 * - Solo se activa en development — el tree-shaking elimina el bundle en prod
 */
export function AxeCoreProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    let disposed = false;

    async function runAxe() {
      if (disposed) return;

      try {
        const axe = (await import('axe-core')).default;

        const result = await axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
          },
          resultTypes: ['violations', 'incomplete'],
        });

        if (result.violations.length > 0) {
          console.group(
            `%c🧐 Accessibility Violations (${result.violations.length})`,
            'color: #e53e3e; font-weight: bold; font-size: 14px;'
          );

          for (const v of result.violations) {
            console.group(
              `%c[${v.impact?.toUpperCase() || 'N/A'}] ${v.id}`,
              'color: #c53030; font-weight: bold;'
            );
            console.log(`%c${v.description}`, 'color: #718096;');
            console.log(`%cHelp: ${v.help}`, 'color: #4a5568;');
            console.log(`%cWCAG: ${v.tags.filter((t: string) => t.startsWith('wcag')).join(', ')}`, 'color: #4a5568;');

            for (const node of v.nodes.slice(0, 10)) {
              const target = node.target?.join(', ') || 'unknown';
              console.log(`%cElement: ${target}`, 'color: #2b6cb0;');
              console.log(`%c  ${node.html}`, 'color: #4a5568; font-size: 11px;');
            }

            if (v.nodes.length > 10) {
              console.log(`%c  ... and ${v.nodes.length - 10} more elements`, 'color: #718096; font-style: italic;');
            }

            console.groupEnd();
          }

          console.groupEnd();
        } else {
          console.log(
            '%c✅ AxeCore: No accessibility violations found',
            'color: #38a169; font-weight: bold;'
          );
        }

        if (result.incomplete && result.incomplete.length > 0) {
          console.group(
            `%c⚠️ AxeCore: ${result.incomplete.length} items need manual review`,
            'color: #d69e2e; font-weight: bold;'
          );
          for (const item of result.incomplete) {
            console.log(`[${item.id}] ${item.description}`);
          }
          console.groupEnd();
        }
      } catch (err) {
        // axe falla silenciosamente en iframes, shadow DOMs con restricciones, etc.
        if (err instanceof Error && err.message?.includes('Axe is already running')) {
          return;
        }
        console.warn('[AxeCore] Audit failed:', err);
      }
    }

    function scheduleAudit() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(runAxe, 2000);
    }

    // 1. Audit inicial
    runAxe();

    // 2. Observar cambios en el DOM (navegación SPA, renders dinámicos)
    observerRef.current = new MutationObserver(() => scheduleAudit());
    observerRef.current.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    return () => {
      disposed = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [pathname]); // se re-ejecuta en cada ruta

  return <>{children}</>;
}
