'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ONBOARDING_STEPS, TOTAL_STEPS, useOnboarding } from './OnboardingContext';
import { useT } from '@/i18n';

// ── Tooltip Position ──────────────────────────────────────────────
interface TooltipPos {
  top: number;
  left: number;
  arrowDir: 'up' | 'down' | 'left' | 'right';
}

function calcTooltipPos(
  target: Element,
  preferred: 'top' | 'bottom' | 'left' | 'right'
): TooltipPos {
  const rect = target.getBoundingClientRect();
  const gap = 12;
  const tooltipW = 320;
  const tooltipH = 180; // approx

  // Try preferred, fallback to avoid viewport clipping
  let top = 0;
  let left = 0;
  let arrowDir: TooltipPos['arrowDir'] = 'up';

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  switch (preferred) {
    case 'bottom':
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      arrowDir = 'up';
      if (top + tooltipH > vh - 20) {
        // fallback to top
        top = rect.top - tooltipH - gap;
        arrowDir = 'down';
      }
      break;
    case 'top':
      top = rect.top - tooltipH - gap;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      arrowDir = 'down';
      if (top < 20) {
        top = rect.bottom + gap;
        arrowDir = 'up';
      }
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - gap;
      arrowDir = 'right';
      if (left < 20) {
        left = rect.right + gap;
        arrowDir = 'left';
      }
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.right + gap;
      arrowDir = 'left';
      if (left + tooltipW > vw - 20) {
        left = rect.left - tooltipW - gap;
        arrowDir = 'right';
      }
      break;
  }

  // Clamp to viewport
  left = Math.max(12, Math.min(left, vw - tooltipW - 12));
  top = Math.max(12, Math.min(top, vh - tooltipH - 12));

  return { top, left, arrowDir };
}

// ── Highlight Overlay ─────────────────────────────────────────────
function HighlightOverlay({ targetSelector }: { targetSelector: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.querySelector(targetSelector);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    // Poll for elements that load after (e.g. dynamic content)
    const interval = setInterval(update, 500);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      clearInterval(interval);
    };
  }, [targetSelector]);

  if (!rect) return null;

  return (
    <>
      {/* Pulse ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed pointer-events-none z-[90]"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
        }}
      >
        <motion.div
          className="w-full h-full rounded-xl border-2 border-[var(--primary)]"
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: [0.8, 0.4, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            boxShadow: '0 0 20px 4px rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.3)',
          }}
        />
      </motion.div>
    </>
  );
}

// ── Tooltip Card ──────────────────────────────────────────────────
function TourTooltip({
  stepIndex,
  arrowDir,
  style,
  onNext,
  onPrev,
  onSkip,
  onJumpTo,
  onClose,
}: {
  stepIndex: number;
  arrowDir: TooltipPos['arrowDir'];
  style: React.CSSProperties;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onJumpTo: (index: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const step = ONBOARDING_STEPS[stepIndex];
  const isLast = stepIndex >= TOTAL_STEPS - 1;
  const isFirst = stepIndex === 0;

  const currentStep = stepIndex;

  const arrowStyle: React.CSSProperties =
    arrowDir === 'up'
      ? { borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid var(--surface-elevated)', bottom: '100%' }
      : arrowDir === 'down'
      ? { borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid var(--surface-elevated)', top: '100%' }
      : arrowDir === 'left'
      ? { borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '8px solid var(--surface-elevated)', right: '100%' }
      : { borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '8px solid var(--surface-elevated)', left: '100%' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed z-[100]"
      style={style}
    >
      <div className="relative bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-2xl w-[320px] overflow-hidden">
        {/* Arrow */}
        <div className="absolute" style={{ ...arrowStyle, zIndex: -1 }} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
          aria-label={t('common.close')}
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header */}
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{step.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
                <Sparkles className="w-3 h-3" />
                {currentStep + 1} / {TOTAL_STEPS}
              </div>
            </div>
          </div>
          <h3 className="font-bold text-[var(--text-primary)] text-sm">
            {t(step.tourKey + 'Title')}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
            {t(step.tourKey + 'Desc')}
          </p>
        </div>

        {/* Progress dots */}
        <div className="px-5 pb-1.5">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <button
                key={i}
                onClick={() => onJumpTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'bg-[var(--primary)] w-6'
                    : i < currentStep
                    ? 'bg-[var(--primary)]/40 w-2'
                    : 'bg-[var(--border)] w-2 hover:bg-[var(--border-strong)]'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 pb-4 pt-1.5">
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
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            {isLast ? (
              <>
                {t('onboarding.finishTour')}
                <CheckCircle2 className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                {t('onboarding.nextStep')}
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Dismiss */}
        {!isLast && (
          <button
            onClick={onSkip}
            className="w-full py-1.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border-t border-[var(--border)] transition-colors bg-[var(--surface)]/50"
          >
            {t('onboarding.dismissTour')}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Intro Overlay ─────────────────────────────────────────────────
function TourIntro({ onStart, onDismiss }: { onStart: () => void; onDismiss: () => void }) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
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
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
          >
            {t('onboarding.startTour')}
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors py-1"
          >
            {t('onboarding.notNow')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export function OnboardingTour() {
  const t = useT();
  const {
    tourOpen,
    currentStep,
    nextStep,
    prevStep,
    skipTour,
    showIntro,
    dismissIntro,
  } = useOnboarding();

  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null);
  const [targetFound, setTargetFound] = useState(false);
  const [activeTooltipStep, setActiveTooltipStep] = useState(currentStep);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = ONBOARDING_STEPS[activeTooltipStep];

  // ── Find target and position tooltip ──────────────────────────
  const repositionTooltip = useCallback(() => {
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

  useEffect(() => {
    if (!tourOpen || showIntro) return;
    setActiveTooltipStep(currentStep);
    // Reset position when step changes
    repositionTooltip();
    // Poll for elements
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!targetFound) {
      intervalRef.current = setInterval(repositionTooltip, 500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tourOpen, currentStep, showIntro, repositionTooltip, targetFound]);

  useEffect(() => {
    if (!tourOpen || showIntro) return;
    window.addEventListener('scroll', repositionTooltip, { passive: true });
    window.addEventListener('resize', repositionTooltip, { passive: true });
    return () => {
      window.removeEventListener('scroll', repositionTooltip);
      window.removeEventListener('resize', repositionTooltip);
    };
  }, [tourOpen, showIntro, repositionTooltip]);

  // ── Scroll to target when step changes ────────────────────────
  useEffect(() => {
    if (!tourOpen || showIntro || !step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeTooltipStep, tourOpen, showIntro, step]);

  // ── Handle next/prev ──────────────────────────────────────────
  const handleNext = useCallback(() => {
    nextStep();
  }, [nextStep]);

  const handlePrev = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleClose = useCallback(() => {
    skipTour();
    dismissIntro();
  }, [skipTour, dismissIntro]);

  const handleJumpTo = useCallback(
    (index: number) => {
      setActiveTooltipStep(index);
    },
    []
  );

  const handleStartTour = useCallback(() => {
    dismissIntro();
  }, [dismissIntro]);

  // ── Render ────────────────────────────────────────────────────
  if (!tourOpen && !showIntro) {
    // User completed all or never started
    return null;
  }

  return (
    <>
      {/* Intro */}
      <AnimatePresence>
        {showIntro && (
          <TourIntro onStart={handleStartTour} onDismiss={handleClose} />
        )}
      </AnimatePresence>

      {/* Highlight overlay */}
      <AnimatePresence>
        {tourOpen && !showIntro && step && targetFound && (
          <HighlightOverlay targetSelector={step.targetSelector} />
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {tourOpen && !showIntro && step && targetFound && tooltipPos && (
          <TourTooltip
            stepIndex={activeTooltipStep}
            arrowDir={tooltipPos.arrowDir}
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
            onNext={handleNext}
            onPrev={handlePrev}
            onSkip={handleClose}
            onJumpTo={handleJumpTo}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>

      {/* Target not found — show floating tooltip */}
      <AnimatePresence>
        {tourOpen && !showIntro && step && !targetFound && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="fixed bottom-6 right-6 z-[100] bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-2xl p-4 max-w-xs"
          >
            <p className="text-xs text-[var(--text-secondary)]">
              {t(step.tourKey + 'Desc')}
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
              {t('onboarding.floatingFallback')}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleNext}
                className="flex-1 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold"
              >
                {t('onboarding.nextStep')}
              </button>
              <button
                onClick={handleClose}
                className="py-1.5 px-3 rounded-lg text-xs text-[var(--text-tertiary)] hover:bg-[var(--surface)]"
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
