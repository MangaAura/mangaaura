import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface SectionTitleProps {
  children: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SectionTitle({ children, icon, action, className, size = 'md' }: SectionTitleProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <h2 className={cn('font-bold flex items-center gap-2', sizeClasses[size])}>
        {icon && <span className="text-[var(--primary)]">{icon}</span>}
        {children}
      </h2>
      {action && <div>{action}</div>}
    </div>
  );
}
