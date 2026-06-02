'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ONBOARDING_STEPS, TOTAL_STEPS, useOnboarding } from './OnboardingContext';
import { useT } from '@/i18n';

const TOUR_STEPS = [
  {
    icon: '🎨',
    gradient: 'from-[var(--primary)] to-[var(--accent-blue)]',
  },
  {
    icon: '🔍',
    gradient: 'from-[var(--accent-purple)] to-[var(--primary)]',
  },
  {
    icon: '📖',
    gradient: 'from-[var(--accent-blue)] to-[var(--accent-green)]',
  },
  {
    icon: '🏆',
    gradient: 'from-[var(--warning)] to-[var(--accent-orange)]',
  },
  {
    icon: '👥',
    gradient: 'from-[var(--accent-purple)] to-[var(--primary)]',
  },
  {
    icon: '📨',
    gradient: 'from-[var(--accent-green)] to-[var(--success)]',
  },
  {
    icon: '📚',
    gradient: 'from-[var(--accent-blue)] to-[var(--primary)]',
  },
  {
    icon: '✨',
    gradient: 'from-[var(--accent-orange)] to-[var(--warning)]',
  },
];

export function OnboardingTour() {
  const t = useT();
  const {
    tourOpen,
    closeTour,
    currentTourStep,
    nextTourStep,
    prevTourStep,
    completeStep,
    allCompleted,
  } = useOnboarding();
  const [direction, setDirection] = useState(0); // -1 = prev, 1 = next
  const [isClosing, setIsClosing] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    if (!tourOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isClosing) {
        handleClose();
      }
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [tourOpen, currentTourStep, isClosing]);

  const handleNext = () => {
    // If on last step, close tour
    if (currentTourStep >= TOTAL_STEPS - 1) {
      handleFinish();
      return;
    }
    setDirection(1);
    // Mark current step as completed
    completeStep(ONBOARDING_STEPS[currentTourStep]);
    nextTourStep();
  };

  const handlePrev = () => {
    setDirection(-1);
    prevTourStep();
  };

  const [showCompletion, setShowCompletion] = useState(false);

  const handleFinish = () => {
    // Mark all remaining steps as completed
    for (const step of ONBOARDING_STEPS) {
      completeStep(step);
    }
    // Show completion message before closing
    setShowCompletion(true);
    setTimeout(() => {
      closeTour();
    }, 2500);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeTour();
      setIsClosing(false);
    }, 200);
  };

  const step = TOUR_STEPS[currentTourStep];
  const stepNum = currentTourStep + 1;
  const totalSteps = TOTAL_STEPS;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 200 : -200,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -200 : 200,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <AnimatePresence>
      {tourOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label={t('onboarding.tourTitle')}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[var(--surface-elevated)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--border)]">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]"
                initial={false}
                animate={{ width: `${((currentTourStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
            </div>

            <div className="p-8 pt-10">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  key={currentTourStep}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 250 }}
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg shadow-[var(--primary)]/20`}
                >
                  <span className="text-3xl">{step.icon}</span>
                </motion.div>
              </div>

              {/* Step counter */}
              <div className="text-center mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-xs font-semibold text-[var(--primary)]">
                  <Sparkles className="w-3 h-3" />
                  {t('home.step1Title').replace('1', String(stepNum))} {stepNum} / {totalSteps}
                </span>
              </div>

              {/* Content */}
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentTourStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="text-center"
                >
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                    {t(`onboarding.tourStep${stepNum}Title`)}
                  </h2>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {t(`onboarding.tourStep${stepNum}Desc`)}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
                <button
                  onClick={handlePrev}
                  disabled={currentTourStep === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-[var(--surface)]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('onboarding.prevStep')}
                </button>

                {/* Dots */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === currentTourStep
                          ? 'bg-[var(--primary)] w-4'
                          : i < currentTourStep
                          ? 'bg-[var(--primary)]/40'
                          : 'bg-[var(--border)]'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                  {currentTourStep >= totalSteps - 1 ? (
                    <>
                      {t('onboarding.finishTour')}
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      {t('onboarding.nextStep')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Skip link */}
              {currentTourStep < totalSteps - 1 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={handleClose}
                    className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline underline-offset-2 transition-colors"
                  >
                    {t('onboarding.dismissTour')}
                  </button>
                </div>
              )}
            </div>

            {/* Completion confetti */}
            {(showCompletion || allCompleted) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-8 pb-6 text-center"
              >
                <div className="p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-[var(--success)] mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('onboarding.completedAll')}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {t('onboarding.completedAllDesc')}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
