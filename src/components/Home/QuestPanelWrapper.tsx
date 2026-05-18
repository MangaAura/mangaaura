'use client';

import { useSession } from 'next-auth/react';

import { QuestPanel } from '@/components/Quest/QuestPanel';
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';

export function QuestPanelWrapper() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  return (
    <AnimatedContainer viewport>
      <QuestPanel />
    </AnimatedContainer>
  );
}