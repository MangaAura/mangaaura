'use client';

import { useSession } from 'next-auth/react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/** The 8 onboarding steps */
export const ONBOARDING_STEPS = ['profile', 'explore', 'read', 'achievement', 'community', 'referral', 'collection', 'profile-complete'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
export const TOTAL_STEPS = ONBOARDING_STEPS.length;

interface OnboardingState {
  /** Which steps the user has completed */
  completedSteps: Set<OnboardingStep>;
  /** Whether the onboarding tour modal is open */
  tourOpen: boolean;
  /** Current step index in the tour */
  currentTourStep: number;
  /** Whether all onboarding steps are done */
  allCompleted: boolean;
}

interface OnboardingContextValue extends OnboardingState {
  /** Mark a step as completed */
  completeStep: (step: OnboardingStep) => void;
  /** Open the onboarding tour modal */
  openTour: () => void;
  /** Close the onboarding tour modal */
  closeTour: () => void;
  /** Go to next tour step */
  nextTourStep: () => void;
  /** Go to previous tour step */
  prevTourStep: () => void;
  /** Reset onboarding (e.g. for testing) */
  resetOnboarding: () => void;
  /** Check if a specific step is completed */
  isStepCompleted: (step: OnboardingStep) => boolean;
  /** Get progress info */
  progress: { completed: number; total: number };
}

const STORAGE_KEY = 'mangaaura-onboarding';

/** Set a localStorage marker for onboarding step detection.
 *  Call from any component when the user performs the corresponding action. */
export function setOnboardingMarker(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`mangaaura-${key}`, 'true');
  } catch {
    // localStorage not available
  }
}

function loadState(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function saveState(completedIds: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedIds));
  } catch {
    // localStorage not available
  }
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [completedIds, setCompletedIds] = useState<string[]>(() => loadState());
  const [tourOpen, setTourOpen] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [hasShownTour, setHasShownTour] = useState(false);

  // Show tour for new users after login, but only once
  useEffect(() => {
    if (!isLoggedIn || hasShownTour) return;
    const saved = loadState();
    if (saved.length < TOTAL_STEPS && !saved.includes('tour_shown')) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setTourOpen(true);
        setHasShownTour(true);
        // Mark tour as shown so it doesn't reappear on every reload
        const current = loadState();
        saveState([...current, 'tour_shown']);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, hasShownTour]);

  const completedSteps = useMemo(() => {
    const set = new Set<OnboardingStep>();
    for (const id of completedIds) {
      if (ONBOARDING_STEPS.includes(id as OnboardingStep)) {
        set.add(id as OnboardingStep);
      }
    }
    return set;
  }, [completedIds]);

  const allCompleted = completedSteps.size >= TOTAL_STEPS;

  const completeStep = useCallback((step: OnboardingStep) => {
    setCompletedIds((prev) => {
      if (prev.includes(step)) return prev;
      const next = [...prev, step];
      saveState(next);
      return next;
    });
  }, []);

  const openTour = useCallback(() => {
    setTourOpen(true);
    setCurrentTourStep(0);
  }, []);

  const closeTour = useCallback(() => {
    setTourOpen(false);
  }, []);

  const nextTourStep = useCallback(() => {
    setCurrentTourStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
  }, []);

  const prevTourStep = useCallback(() => {
    setCurrentTourStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const resetOnboarding = useCallback(() => {
    setCompletedIds([]);
    saveState([]);
  }, []);

  const isStepCompleted = useCallback(
    (step: OnboardingStep) => completedSteps.has(step),
    [completedSteps]
  );

  const progress = useMemo(
    () => ({ completed: completedSteps.size, total: TOTAL_STEPS }),
    [completedSteps.size]
  );

  const value = useMemo(
    () => ({
      completedSteps,
      tourOpen,
      currentTourStep,
      allCompleted,
      completeStep,
      openTour,
      closeTour,
      nextTourStep,
      prevTourStep,
      resetOnboarding,
      isStepCompleted,
      progress,
    }),
    [
      completedSteps,
      tourOpen,
      currentTourStep,
      allCompleted,
      completeStep,
      openTour,
      closeTour,
      nextTourStep,
      prevTourStep,
      resetOnboarding,
      isStepCompleted,
      progress,
    ]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
