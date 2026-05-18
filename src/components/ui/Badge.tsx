import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[var(--primary)] text-[var(--text-inverse)] hover:bg-[var(--primary-hover)]',
        secondary:
          'border-transparent bg-[var(--surface-sunken)] text-[var(--text-primary)] hover:bg-[var(--surface-sunken)]',
      destructive:
        'border-transparent bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20',
        outline: 'text-[var(--text-secondary)] border-[var(--border)]',
      success:
        'border-transparent bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/20',
      warning:
        'border-transparent bg-[var(--warning)]/10 text-[var(--warning)] hover:bg-[var(--warning)]/20',
        ink: 'border-transparent bg-gradient-to-r from-[var(--accent-purple)] to-[var(--primary)] text-[var(--text-inverse)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
