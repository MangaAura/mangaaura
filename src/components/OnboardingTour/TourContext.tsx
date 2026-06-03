'use client';

import { useSession } from 'next-auth/react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';

// ── Step Definitions ──
export interface TourStep {
  /** CSS selector for the highlighted element */
  targetSelector: string;
  /** Preferred tooltip position */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** Emoji icon */
  icon: string;
  /** i18n key prefix for title */
  titleKey: string;
  /** i18n key prefix for description */
  descKey: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-onboarding="profile"]',
    position: 'bottom',
    icon: '👤',
    titleKey: 'onboarding.step1Title',
    descKey: 'onboarding.step1Desc',
  },
  {
    targetSelector: '[data-onboarding="search"]',
    position: 'bottom',
    icon: '🔍',
    titleKey: 'onboarding.step2Title',
    descKey: 'onboarding.step2Desc',
  },
  {
    targetSelector: '[data-onboarding="nav"]',
    position: 'bottom',
    icon: '🧭',
    titleKey: 'onboarding.step3Title',
    descKey: 'onboarding.step3Desc',
  },
  {
    targetSelector: '[data-onboarding="notifications"]',
    position: 'bottom',
    icon: '🔔',
    titleKey: 'onboarding.step4Title',
    descKey: 'onboarding.step4Desc',
  },
];

export const TOTAL_STEPS = TOUR_STEPS.length;

// ── State ──
interface TourState {
  tourOpen: boolean;
  currentStep: number;
  showIntro: boolean;
  completed: boolean;
}

interface TourContextValue extends TourState {
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  startTour: () => void;
  dismissIntro: () => void;
  restartTour: () => void;
}

const STORAGE_KEY = 'mangaaura-tour-completed';

function isTourCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function markTourCompleted() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // noop
  }
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const [tourOpen, setTourOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showIntro, setShowIntro] = useState(false);
  const [completed, setCompleted] = useState(() => isTourCompleted());
  const hasAttempted = useRef(false);

  // ── Auto-show for new users ──
  useEffect(() => {
    if (!isLoggedIn || completed || hasAttempted.current) return;
    hasAttempted.current = true;

    const timer = setTimeout(() => {
      setShowIntro(true);
      setTourOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoggedIn, completed]);

  // ── Inject data-onboarding markers into header elements ──
  useEffect(() => {
    if (!tourOpen) return;

    const inject = () => {
      const header = document.querySelector('header');
      if (!header) return;

      // Profile: button with avatar img + chevron
      const profileBtn = Array.from(header.querySelectorAll('button')).find(
        (btn) =>
          (btn.querySelector('img[alt]') || btn.innerHTML.includes('rounded-full')) &&
          (btn.innerHTML.includes('chevron-down') || btn.innerHTML.includes('ChevronDown'))
      );
      if (profileBtn && !profileBtn.hasAttribute('data-onboarding')) {
        profileBtn.setAttribute('data-onboarding', 'profile');
      }

      // Search: form[role="search"]
      const searchForm = header.querySelector('form[role="search"]');
      if (searchForm && !searchForm.hasAttribute('data-onboarding')) {
        const container = searchForm.closest('div');
        if (container) container.setAttribute('data-onboarding', 'search');
      }

      // Nav
      const nav = header.querySelector('nav[aria-label]');
      if (nav && !nav.hasAttribute('data-onboarding')) {
        nav.setAttribute('data-onboarding', 'nav');
      }

      // Notifications: button with Bell icon + aria-label
      const notifBtn = Array.from(header.querySelectorAll('button')).find(
        (btn) =>
          (btn.innerHTML.includes('Bell') || btn.innerHTML.includes('bell')) &&
          btn.getAttribute('aria-label')
      );
      if (notifBtn && !notifBtn.hasAttribute('data-onboarding')) {
        notifBtn.setAttribute('data-onboarding', 'notifications');
      }
    };

    inject();
    const timer = setTimeout(inject, 600);
    return () => clearTimeout(timer);
  }, [tourOpen, currentStep]);

  // ── Actions ──
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= TOTAL_STEPS - 1) {
        markTourCompleted();
        setCompleted(true);
        setTourOpen(false);
        setShowIntro(false);
        return prev;
      }
      return prev + 1;
    });
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const skipTour = useCallback(() => {
    markTourCompleted();
    setCompleted(true);
    setTourOpen(false);
    setShowIntro(false);
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setShowIntro(false);
  }, []);

  const dismissIntro = useCallback(() => {
    setShowIntro(false);
  }, []);

  const restartTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    setCompleted(false);
    setCurrentStep(0);
    setTourOpen(true);
    setShowIntro(false);
  }, []);

  const value = useMemo(
    () => ({
      tourOpen,
      currentStep,
      showIntro,
      completed,
      nextStep,
      prevStep,
      skipTour,
      startTour,
      dismissIntro,
      restartTour,
    }),
    [tourOpen, currentStep, showIntro, completed, nextStep, prevStep, skipTour, startTour, dismissIntro, restartTour]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return ctx;
}
