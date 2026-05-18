'use client';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
const skeletonVariants = cva(
  'relative overflow-hidden rounded-md bg-surface-elevated',
  {
    variants: {
      variant: {
        text: 'h-4 w-full',
        heading: 'h-8 w-3/4',
        title: 'h-6 w-1/2',
        avatar: 'h-12 w-12 rounded-full',
        image: 'aspect-[3/4] w-full',
        card: 'h-64 w-full',
        button: 'h-10 w-24',
        badge: 'h-5 w-16 rounded-full',
        stat: 'h-8 w-20',
        hero: 'h-[70vh] w-full rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'text',
    },
  }
);

interface SkeletonProps extends VariantProps<typeof skeletonVariants> {
  className?: string;
}

export function Skeleton({ variant, className }: SkeletonProps) {
  return (
    <div className={cn(skeletonVariants({ variant }), className)}>
      <div className="absolute inset-0 animate-pulse bg-[var(--surface-elevated)]" />
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
