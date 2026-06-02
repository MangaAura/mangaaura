'use client';

import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

import { useOnboarding, ONBOARDING_STEPS, type OnboardingStep } from './OnboardingContext';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useT } from '@/i18n';

interface StepConfig {
  key: OnboardingStep;
  detection: () => boolean;
}

export const STEP_DETECTORS: StepConfig[] = [
  {
    key: 'profile',
    detection: () => {
      if (typeof window === 'undefined') return false;
      const hasSetProfile = localStorage.getItem('mangaaura-profile-set') === 'true';
      return hasSetProfile;
    },
  },
  {
    key: 'explore',
    detection: () => {
      if (typeof window === 'undefined') return false;
      const hasExplored = localStorage.getItem('mangaaura-has-explored') === 'true';
      return hasExplored;
    },
  },
  {
    key: 'read',
    detection: () => {
      if (typeof window === 'undefined') return false;
      const hasRead = localStorage.getItem('mangaaura-has-read') === 'true';
      return hasRead;
    },
  },
  {
    key: 'achievement',
    detection: () => {
      if (typeof window === 'undefined') return false;
      const hasAchievement = localStorage.getItem('mangaaura-has-achievement') === 'true';
      return hasAchievement;
    },
  },
  {
    key: 'community',
    detection: () => {
      if (typeof window === 'undefined') return false;
      const hasJoinedCommunity = localStorage.getItem('mangaaura-joined-community') === 'true';
      return hasJoinedCommunity;
    },
  },
  {
    key: 'referral',
    detection: () => {
      if (typeof window === 'undefined') return false;
      const hasReferred = localStorage.getItem('mangaaura-has-referred') === 'true';
      return hasReferred;
    },
  },
  {
    key: 'collection',
    detection: () => {
      if (typeof window === 'undefined') return false;
      const hasCollection = localStorage.getItem('mangaaura-has-collection') === 'true';
      return hasCollection;
    },
  },
  {
    key: 'profile-complete',
    detection: () => {
      if (typeof window === 'undefined') return false;
      // User has fully completed their profile with display name, avatar, bio
      const hasCompleteProfile = localStorage.getItem('mangaaura-profile-complete') === 'true';
      return hasCompleteProfile;
    },
  },
];

interface OnboardingChecklistProps {
  /** When true, auto-detect completed steps from localStorage markers */
  autoDetect?: boolean;
  /** If provided, these steps override auto-detection */
  initialCompleted?: OnboardingStep[];
}

export function OnboardingChecklist({
  autoDetect = true,
  initialCompleted,
}: OnboardingChecklistProps) {
  const t = useT();
  const { completedSteps, completeStep, openTour, progress, allCompleted } =
    useOnboarding();

  // Auto-detect completed steps
  useEffect(() => {
    if (!autoDetect) return;

    // Mark from initialCompleted if provided
    if (initialCompleted) {
      for (const step of initialCompleted) {
        if (!completedSteps.has(step)) {
          completeStep(step);
        }
      }
    }

    // Auto-detect from localStorage markers
    for (const detector of STEP_DETECTORS) {
      if (!completedSteps.has(detector.key) && detector.detection()) {
        completeStep(detector.key);
      }
    }
  }, [autoDetect, initialCompleted, completedSteps, completeStep]);

  // If all completed, don't show the checklist
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
              {t('onboarding.progress', {
                completed: progress.completed,
                total: progress.total,
              })}
            </span>
          </div>

          {/* Steps */}
          {ONBOARDING_STEPS.map((step) => {
            const isDone = completedSteps.has(step);
            return (
              <div
                key={step}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                  isDone
                    ? 'opacity-60'
                    : 'hover:bg-[var(--surface)]/50'
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
                    {t(`onboarding.step${ONBOARDING_STEPS.indexOf(step) + 1}`)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {t(`onboarding.step${ONBOARDING_STEPS.indexOf(step) + 1}Desc`)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Continue tour button */}
          <button
            onClick={openTour}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {t('onboarding.continueTour')}
          </button>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}
