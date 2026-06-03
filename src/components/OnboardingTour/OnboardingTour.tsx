'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { TOUR_STEPS, TOTAL_STEPS, useTour } from './TourContext';
import { useT } from '@/i18n';

// ── Tooltip Position ──
interface TooltipPos { top: number; left: number; arrowDir: 'up' | 'down' | 'left' | 'right'; }

function calcTooltipPos(target: Element, preferred: 'top' | 'bottom' | 'left' | 'right'): TooltipPos {
  const rect = target.getBoundingClientRect();
  const gap = 12;
  const tooltipW = 300;
  const tooltipH = 200;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = 0, left = 0;
  let arrowDir: TooltipPos['arrowDir'] = 'up';

  switch (preferred) {
    case 'bottom':
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      arrowDir = 'up';
      if (top + tooltipH > vh - 20) { top = rect.top - tooltipH - gap; arrowDir = 'down'; }
      break;
    case 'top':
      top = rect.top - tooltipH - gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      arrowDir = 'down';
      if (top < 20) { top = rect.bottom + gap; arrowDir = 'up'; }
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - gap;
      arrowDir = 'right';
      if (left < 20) { left = rect.right + gap; arrowDir = 'left'; }
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.right + gap;
      arrowDir = 'left';
      if (left + tooltipW > vw - 20) { left = rect.left - tooltipW - gap; arrowDir = 'right'; }
      break;
  }
  left = Math.max(12, Math.min(left, vw - tooltipW - 12));
  top = Math.max(12, Math.min(top, vh - tooltipH - 12));
  return { top, left, arrowDir };
}

// ── Spotlight Overlay ──
function Spotlight({ targetSelector, children }: { targetSelector: string; children: React.ReactNode }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.querySelector(targetSelector);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    const interval = setInterval(update, 500);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      clearInterval(interval);
    };
  }, [targetSelector]);

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none">
      {/* Darkened backdrop with cutout SVG */}
      <svg className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - 4}
                y={rect.top - 4}
                width={rect.width + 8}
                height={rect.height + 8}
                rx={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Pulse ring around target */}
      {rect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute pointer-events-none"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        >
          <motion.div
            className="w-full h-full rounded-xl border-2 border-[var(--primary)]"
            animate={{ opacity: [0.8, 0.3, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className="absolute inset-0 rounded-xl"
            style={{ boxShadow: '0 0 24px 6px rgb(from var(--primary) r g b / 0.35)' }}
          />
        </motion.div>
      )}

      {/* Interactive content (tooltip) */}
      <div className="absolute inset-0 pointer-events-auto">
        {children}
      </div>
    </div>
  );
}

// ── Tooltip Card ──
function TourTooltip({
  stepIndex,
  arrowDir,
  style,
  onNext,
  onPrev,
  onSkip,
}: {
  stepIndex: number;
  arrowDir: TooltipPos['arrowDir'];
  style: React.CSSProperties;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const t = useT();
  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex >= TOTAL_STEPS - 1;
  const isFirst = stepIndex === 0;

  const arrowStyle: React.CSSProperties =
    arrowDir === 'up'
      ? { borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid var(--surface-elevated)', bottom: '100%', left: '50%', marginLeft: -8 }
      : arrowDir === 'down'
      ? { borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid var(--surface-elevated)', top: '100%', left: '50%', marginLeft: -8 }
      : arrowDir === 'left'
      ? { borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid var(--surface-elevated)', right: '100%', top: '50%', marginTop: -8 }
      : { borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '8px solid var(--surface-elevated)', left: '100%', top: '50%', marginTop: -8 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed z-[100]"
      style={style}
    >
      <div className="relative bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-2xl w-[300px] overflow-hidden">
        {/* Arrow */}
        <div className="absolute" style={{ ...arrowStyle }} />

        {/* Content */}
        <div className="px-4 pt-4 pb-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{step.icon}</span>
              <span className="text-xs font-semibold text-[var(--primary)]">
                <Sparkles className="w-3 h-3 inline mr-1" />
                {stepIndex + 1} / {TOTAL_STEPS}
              </span>
            </div>
          </div>
          <h3 className="font-bold text-sm text-[var(--text-primary)] mt-1">
            {t(step.titleKey)}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
            {t(step.descKey)}
          </p>
        </div>

        {/* Progress dots */}
        <div className="px-4 pb-1">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIndex
                    ? 'bg-[var(--primary)] w-5'
                    : i < stepIndex
                    ? 'bg-[var(--primary)]/40 w-1.5'
                    : 'bg-[var(--border)] w-1.5'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 pb-2 pt-1">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className="flex items-center gap-1 text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1 rounded-md hover:bg-[var(--surface)]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {t('onboarding.prevStep')}
          </button>

          <button
            onClick={onNext}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            {isLast ? (
              <>{t('onboarding.finishTour')} <CheckCircle2 className="w-3.5 h-3.5" /></>
            ) : (
              <>{t('onboarding.nextStep')} <ChevronRight className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>

        {/* Dismiss */}
        <button
          onClick={onSkip}
          className="w-full py-1.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border-t border-[var(--border)] transition-colors bg-[var(--surface)]/50"
        >
          {t('onboarding.dismissTour')}
        </button>
      </div>
    </motion.div>
  );
}

// ── Intro Modal ──
function TourIntro({ onStart, onDismiss }: { onStart: () => void; onDismiss: () => void }) {
  const t = useT();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          {t('onboarding.tourTitle')}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
          {t('onboarding.tourSubtitle')}
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onStart}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            {t('onboarding.startTour')}
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors py-1 cursor-pointer"
          >
            {t('onboarding.notNow')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ──
export function OnboardingTour() {
  const t = useT();
  const { tourOpen, currentStep, showIntro, nextStep, prevStep, skipTour, startTour } = useTour();
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null);
  const [targetFound, setTargetFound] = useState(false);
  const [activeStep, setActiveStep] = useState(currentStep);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const step = TOUR_STEPS[activeStep];

  const reposition = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      setTargetFound(true);
      setTooltipPos(calcTooltipPos(el, step.position));
    } else {
      setTargetFound(false);
      setTooltipPos(null);
    }
  }, [step]);

  // Sync active step with currentStep when tour is open
  useEffect(() => {
    if (!tourOpen || showIntro) return;
    setActiveStep(currentStep);
    reposition();
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!targetFound) {
      intervalRef.current = setInterval(reposition, 500);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tourOpen, currentStep, showIntro, reposition, targetFound]);

  // Scroll to target on step change
  useEffect(() => {
    if (!tourOpen || showIntro || !step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeStep, tourOpen, showIntro, step]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!tourOpen || showIntro) return;
    window.addEventListener('scroll', reposition, { passive: true });
    window.addEventListener('resize', reposition, { passive: true });
    return () => {
      window.removeEventListener('scroll', reposition);
      window.removeEventListener('resize', reposition);
    };
  }, [tourOpen, showIntro, reposition]);

  if (!tourOpen && !showIntro) return null;

  return (
    <>
      {/* Intro */}
      <AnimatePresence>
        {showIntro && <TourIntro onStart={startTour} onDismiss={skipTour} />}
      </AnimatePresence>

      {/* Spotlight + Tooltip */}
      <AnimatePresence>
        {tourOpen && !showIntro && step && targetFound && (
          <Spotlight key={`spotlight-${activeStep}`} targetSelector={step.targetSelector}>
            {tooltipPos && (
              <TourTooltip
                stepIndex={activeStep}
                arrowDir={tooltipPos.arrowDir}
                style={{ top: tooltipPos.top, left: tooltipPos.left }}
                onNext={nextStep}
                onPrev={prevStep}
                onSkip={skipTour}
              />
            )}
          </Spotlight>
        )}
      </AnimatePresence>

      {/* Floating fallback when target not found */}
      <AnimatePresence>
        {tourOpen && !showIntro && step && !targetFound && (
          <motion.div
            key={`fallback-${activeStep}`}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="fixed bottom-6 right-6 z-[100] bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-2xl p-4 max-w-xs"
          >
            <p className="text-xs text-[var(--text-secondary)]">{t(step.descKey)}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{t('onboarding.floatFallback')}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={nextStep}
                className="flex-1 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer"
              >
                {t('onboarding.nextStep')}
              </button>
              <button
                onClick={skipTour}
                className="py-1.5 px-3 rounded-lg text-xs text-[var(--text-tertiary)] hover:bg-[var(--surface)] cursor-pointer"
              >
                {t('onboarding.skipStep')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
