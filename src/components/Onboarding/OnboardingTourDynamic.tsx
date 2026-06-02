'use client';

import dynamic from 'next/dynamic';

const OnboardingTourInner = dynamic(
  () => import('@/components/Onboarding/OnboardingTour').then((m) => ({ default: m.OnboardingTour })),
  { ssr: false }
);

export function OnboardingTourDynamic() {
  return <OnboardingTourInner />;
}
