import { cva, type VariantProps } from 'class-variance-authority';
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

const sectionTitleVariants = cva('font-bold flex items-center gap-2', {
  variants: {
    size: {
      sm: 'text-lg',
      md: 'text-2xl',
      lg: 'text-3xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

interface SectionTitleProps extends VariantProps<typeof sectionTitleVariants> {
  children: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionTitle({ children, icon, action, className, size }: SectionTitleProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <h2 className={cn(sectionTitleVariants({ size }))}>
        {icon && <span className="text-[var(--primary)]">{icon}</span>}
        {children}
      </h2>
      {action && <div>{action}</div>}
    </div>
  );
}
