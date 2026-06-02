'use client';

import { useSession } from 'next-auth/react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// ── Step Definitions ──────────────────────────────────────────────
export interface TourStep {
  /** CSS selector for the element to highlight */
  targetSelector: string;
  /** Where to place the tooltip relative to the target */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** Icon identifier */
  icon: string;
  /** i18n key for checklist (short label + desc) */
  i18nKey: string;
  /** i18n key prefix for tour tooltip (appended Title/Desc) */
  tourKey: string;
  /** Marker to set in localStorage when this step is completed */
  marker: string;
}

export const ONBOARDING_STEPS: TourStep[] = [
  {
    targetSelector: '[data-onboarding="profile"]',
    position: 'bottom',
    icon: '👤',
    i18nKey: 'onboarding.step1',
    tourKey: 'onboarding.tourStep1',
    marker: 'has-setup-profile',
  },
  {
    targetSelector: '[data-onboarding="search"]',
    position: 'bottom',
    icon: '🔍',
    i18nKey: 'onboarding.step2',
    tourKey: 'onboarding.tourStep2',
    marker: 'has-explored',
  },
  {
    targetSelector: '[data-onboarding="notifications"]',
    position: 'bottom',
    icon: '🔔',
    i18nKey: 'onboarding.step3',
    tourKey: 'onboarding.tourStep3',
    marker: 'has-read-chapter',
  },
  {
    targetSelector: '[data-onboarding="nav"]',
    position: 'bottom',
    icon: '🧭',
    i18nKey: 'onboarding.step4',
    tourKey: 'onboarding.tourStep4',
    marker: 'has-explored-nav',
  },
  {
    targetSelector: '[data-onboarding="messages"]',
    position: 'bottom',
    icon: '💬',
    i18nKey: 'onboarding.step5',
    tourKey: 'onboarding.tourStep5',
    marker: 'has-visited-messages',
  },
  {
    targetSelector: '[data-onboarding="creator"]',
    position: 'bottom',
    icon: '✨',
    i18nKey: 'onboarding.step6',
    tourKey: 'onboarding.tourStep6',
    marker: 'has-visited-creator',
  },
];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]['marker'];

// ── State ─────────────────────────────────────────────────────────
interface OnboardingState {
  /** Whether the tour is currently visible */
  tourOpen: boolean;
  /** Current step index */
  currentStep: number;
  /** Steps completed so far (by marker) */
  completedMarkers: Set<string>;
  /** Whether all steps are done */
  allCompleted: boolean;
  /** Whether the intro animation is playing */
  showIntro: boolean;
}

interface OnboardingContextValue extends OnboardingState {
  /** Advance to the next step */
  nextStep: () => void;
  /** Go to previous step */
  prevStep: () => void;
  /** Mark a step as completed and optionally advance */
  completeStep: (marker: string) => void;
  /** Skip the entire tour */
  skipTour: () => void;
  /** Restart the tour from the beginning */
  restartTour: () => void;
  /** Check if a marker is completed */
  isCompleted: (marker: string) => boolean;
  /** Get current progress */
  progress: { completed: number; total: number };
  /** Dismiss intro */
  dismissIntro: () => void;
}

const STORAGE_KEY = 'mangaaura-onboarding';

function loadCompletedMarkers(): string[] {
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

function saveCompletedMarkers(markers: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  } catch {
    // noop
  }
}

/** Set a one-shot marker. Call from other components when user does something. */
export function setOnboardingMarker(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    // Set a dedicated localStorage key for detection
    localStorage.setItem(`mangaaura-${key}`, 'true');
    // Also save to the onboarding markers list
    const current = loadCompletedMarkers();
    if (!current.includes(key)) {
      saveCompletedMarkers([...current, key]);
    }
  } catch {
    // noop
  }
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const [completedMarkers, setCompletedMarkers] = useState<string[]>(() => loadCompletedMarkers());
  const [tourOpen, setTourOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasShown, setHasShown] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const completedSet = useMemo(() => new Set(completedMarkers), [completedMarkers]);

  const allCompleted = ONBOARDING_STEPS.every((s) => completedSet.has(s.marker));

  // ── Auto-show tour for new users ──────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || hasShown || allCompleted) return;
    const saved = loadCompletedMarkers();
    // Only show if no steps have been completed yet and never shown before
    if (saved.length === 0 && !saved.includes('tour_shown')) {
      const timer = setTimeout(() => {
        setShowIntro(true);
        setTourOpen(true);
        setHasShown(true);
        saveCompletedMarkers(['tour_shown']);
      }, 1200);
      return () => clearTimeout(timer);
    } else if (saved.length < ONBOARDING_STEPS.length && !saved.includes('tour_shown')) {
      // User has some progress but never saw the tour — show it
      const timer = setTimeout(() => {
        setShowIntro(true);
        setTourOpen(true);
        setHasShown(true);
        // Find the first uncompleted step
        const firstIncomplete = ONBOARDING_STEPS.findIndex((s) => !saved.includes(s.marker));
        setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : 0);
        saveCompletedMarkers([...saved, 'tour_shown']);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setHasShown(true);
    }
  }, [isLoggedIn, hasShown, allCompleted]);

  // ── Auto-detect markers set by other components ───────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    let changed = false;
    const updated = [...completedMarkers];
    for (const step of ONBOARDING_STEPS) {
      if (!updated.includes(step.marker)) {
        try {
          const markerVal = localStorage.getItem(`mangaaura-${step.marker}`);
          if (markerVal === 'true') {
            updated.push(step.marker);
            changed = true;
          }
        } catch { /* noop */ }
      }
    }
    if (changed) {
      setCompletedMarkers(updated);
      saveCompletedMarkers(updated);
    }
  }, [isLoggedIn, completedMarkers]);

  // ── Actions ───────────────────────────────────────────────────
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, TOTAL_STEPS - 1);
      // Mark current step as completed
      const marker = ONBOARDING_STEPS[prev]?.marker;
      if (marker) {
        setCompletedMarkers((prevMarkers) => {
          if (prevMarkers.includes(marker)) return prevMarkers;
          const updated = [...prevMarkers, marker];
          saveCompletedMarkers(updated);
          return updated;
        });
      }
      return next;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const completeStep = useCallback((marker: string) => {
    setCompletedMarkers((prev) => {
      if (prev.includes(marker)) return prev;
      const updated = [...prev, marker];
      saveCompletedMarkers(updated);
      return updated;
    });
  }, []);

  const skipTour = useCallback(() => {
    setTourOpen(false);
    setShowIntro(false);
    // Mark all as completed so it doesn't reappear
    const all = ONBOARDING_STEPS.map((s) => s.marker);
    const merged = [...new Set([...completedMarkers, ...all])];
    if (!merged.includes('tour_shown')) merged.push('tour_shown');
    setCompletedMarkers(merged);
    saveCompletedMarkers(merged);
  }, [completedMarkers]);

  const restartTour = useCallback(() => {
    setCurrentStep(0);
    setTourOpen(true);
    setShowIntro(true);
  }, []);

  const dismissIntro = useCallback(() => {
    setShowIntro(false);
  }, []);

  const progress = useMemo(
    () => ({ completed: completedSet.size, total: TOTAL_STEPS }),
    [completedSet.size]
  );

  const isCompleted = useCallback(
    (marker: string) => completedSet.has(marker),
    [completedSet]
  );

  const value = useMemo(
    () => ({
      tourOpen,
      currentStep,
      completedMarkers: completedSet,
      allCompleted,
      showIntro,
      nextStep,
      prevStep,
      completeStep,
      skipTour,
      restartTour,
      isCompleted,
      progress,
      dismissIntro,
    }),
    [
      tourOpen,
      currentStep,
      completedSet,
      allCompleted,
      showIntro,
      nextStep,
      prevStep,
      completeStep,
      skipTour,
      restartTour,
      isCompleted,
      progress,
      dismissIntro,
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
