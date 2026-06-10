'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  XIcon,
  RocketIcon,
  ArrowRightIcon,
  SparklesIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import useSWR from 'swr';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  link: string;
  icon: string;
}

interface OnboardingStatus {
  steps: OnboardingStep[];
  completedCount: number;
  totalSteps: number;
  isComplete: boolean;
}

interface CreatorOnboardingWizardProps {
  className?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const STORAGE_KEY = 'mangaaura-creator-onboarding-dismissed';

export function CreatorOnboardingWizard({ className }: CreatorOnboardingWizardProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const { data, error, isLoading } = useSWR<OnboardingStatus>(
    '/api/creator/onboarding-status',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    },
  );

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // noop
    }
  }, []);

  // No mostrar si: loading, error, completo, dismissed, o sin datos
  if (isLoading || error || dismissed || !data || data.isComplete) return null;

  const { steps, completedCount, totalSteps } = data;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5',
          className,
        )}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors z-10"
          aria-label="Cerrar onboarding"
        >
          <XIcon className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
              <RocketIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                ¡Bienvenido, Creador!
                <SparklesIcon className="w-5 h-5 text-amber-500" />
              </h2>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                Sigue estos pasos para empezar a publicar tu manga y atraer lectores
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Progreso: {completedCount}/{totalSteps} pasos
              </span>
              <span className="text-xs font-semibold text-[var(--primary)]">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-[var(--surface-sunken)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isExpanded = expandedStep === step.id;
              const isNextUp = !step.completed && (index === 0 || steps[index - 1].completed);

              return (
                <div
                  key={step.id}
                  className={cn(
                    'group rounded-xl border transition-all duration-200',
                    step.completed
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : isNextUp
                      ? 'bg-indigo-500/5 border-indigo-500/30 ring-1 ring-indigo-500/20'
                      : 'bg-[var(--surface)]/50 border-[var(--border)] hover:border-[var(--text-muted)]',
                  )}
                >
                  <div className="flex items-center gap-3 p-3.5">
                    {/* Status icon */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm transition-all',
                        step.completed
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : isNextUp
                          ? 'bg-indigo-500/20 text-indigo-500 ring-2 ring-indigo-500/30'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)]',
                      )}
                    >
                      {step.completed ? (
                        <CheckCircle2Icon className="w-5 h-5" />
                      ) : (
                        <span className="font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Step info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{step.icon}</span>
                        <span
                          className={cn(
                            'font-semibold text-sm',
                            step.completed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[var(--text-primary)]',
                          )}
                        >
                          {step.title}
                        </span>
                      </div>
                      {isExpanded && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-[var(--text-tertiary)] mt-1 ml-6"
                        >
                          {step.description}
                        </motion.p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {step.completed ? (
                        <span className="text-xs text-emerald-500 font-medium px-2">
                          Hecho
                        </span>
                      ) : (
                        <Link
                          href={step.link}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 text-xs font-semibold transition-colors"
                          onClick={handleDismiss}
                        >
                          {isNextUp ? 'Empezar' : 'Ir'}
                          <ExternalLinkIcon className="w-3 h-3" />
                        </Link>
                      )}
                      <button
                        onClick={() =>
                          setExpandedStep(isExpanded ? null : step.id)
                        }
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-sunken)] text-[var(--text-tertiary)] transition-colors"
                      >
                        <ChevronRightIcon
                          className={cn(
                            'w-4 h-4 transition-transform',
                            isExpanded && 'rotate-90',
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--text-tertiary)]">
              {completedCount === totalSteps
                ? '¡Has completado todos los pasos!'
                : `${totalSteps - completedCount} paso${totalSteps - completedCount !== 1 ? 's' : ''} restante${totalSteps - completedCount !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Ocultar
              </Button>
              {completedCount === totalSteps && (
                <Link href="/creator/dashboard">
                  <Button size="sm">
                    Ir al Dashboard
                    <ArrowRightIcon className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
