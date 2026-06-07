'use client';

import { useSession } from 'next-auth/react';
import { ExitIntentPopup } from './ExitIntentPopup';

export function ExitIntentProvider() {
  const { data: session } = useSession();
  if (session?.user) return null;
  return <ExitIntentPopup />;
}
