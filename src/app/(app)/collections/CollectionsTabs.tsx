'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

interface CollectionsTabsProps {
  defaultValue: string;
  userId?: string | null;
  allLabel: string;
  publicLabel: string;
  privateLabel: string;
  children: React.ReactNode;
}

export function CollectionsTabs({
  defaultValue,
  userId,
  allLabel,
  publicLabel,
  privateLabel,
  children,
}: CollectionsTabsProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Sync with URL changes (browser back/forward navigation)
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <Tabs
      value={value}
      onValueChange={(newValue) => {
        setValue(newValue);
        router.push(`/collections?filter=${newValue}`);
      }}
      className="mb-6"
    >
      <TabsList>
        <TabsTrigger value="all">{allLabel}</TabsTrigger>
        <TabsTrigger value="public">{publicLabel}</TabsTrigger>
        {userId && <TabsTrigger value="private">{privateLabel}</TabsTrigger>}
      </TabsList>
      <TabsContent value="all">{children}</TabsContent>
      <TabsContent value="public">{children}</TabsContent>
      {userId && <TabsContent value="private">{children}</TabsContent>}
    </Tabs>
  );
}
