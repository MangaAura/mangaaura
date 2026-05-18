import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
  backLink?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  action,
  backLink,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      {backLink && (
        <Link
          href={backLink.href}
          className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {backLink.label}
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{title}</h1>
            {description && (
              <p className="text-[var(--text-secondary)] mt-1">{description}</p>
            )}
          </div>
        </div>

        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center justify-center px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-inverse)] rounded-lg font-medium transition-colors"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

export function PageTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        'text-2xl sm:text-3xl font-bold text-[var(--text-primary)]',
        className
      )}
    >
      {children}
    </h1>
  );
}

export function PageDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('text-[var(--text-secondary)]', className)}>
      {children}
    </p>
  );
}
