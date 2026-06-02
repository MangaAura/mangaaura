'use client';

import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

import { ONBOARDING_STEPS, useOnboarding } from './OnboardingContext';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useT } from '@/i18n';

interface OnboardingChecklistProps {
  /** Auto-detect completed steps from localStorage markers */
  autoDetect?: boolean;
}

export function OnboardingChecklist({ autoDetect = true }: OnboardingChecklistProps) {
  const t = useT();
  const {
    completedMarkers,
    allCompleted,
    progress,
    completeStep,
    restartTour,
  } = useOnboarding();

  // Auto-detect markers set by other components
  useEffect(() => {
    if (!autoDetect) return;
    for (const step of ONBOARDING_STEPS) {
      if (!completedMarkers.has(step.marker)) {
        try {
          const val = localStorage.getItem(`mangaaura-${step.marker}`);
          if (val === 'true') {
            completeStep(step.marker);
          }
        } catch { /* noop */ }
      }
    }
  }, [autoDetect, completedMarkers, completeStep]);

  if (allCompleted) return null;

  return (
    <AnimatedContainer viewport animation="fadeInUp">
      <Card className="border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/[0.03] to-[var(--accent-purple)]/[0.03]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            {t('onboarding.checklistTitle')}
          </CardTitle>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('onboarding.checklistSubtitle')}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)] rounded-full transition-all duration-500"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
              {progress.completed}/{progress.total}
            </span>
          </div>

          {/* Steps */}
          {ONBOARDING_STEPS.map((step) => {
            const isDone = completedMarkers.has(step.marker);
            return (
              <div
                key={step.marker}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                  isDone ? 'opacity-60' : 'hover:bg-[var(--surface)]/50'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isDone
                        ? 'text-[var(--text-secondary)] line-through'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {t(step.i18nKey)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {t(step.i18nKey + 'Desc')}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Resume tour button */}
          {!allCompleted && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={restartTour}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Continue tour
            </Button>
          )}
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}
