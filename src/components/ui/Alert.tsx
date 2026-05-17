import * as React from 'react';
import { cn } from '@/lib/utils';

interface AlertProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'warning';
}

const variantStyles: Record<string, string> = {
  default: 'border-[var(--border)] bg-[var(--surface)]',
  destructive: 'border-[var(--error)] bg-[var(--error)]/10 text-[var(--error)]',
  warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600',
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, children, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Alert.displayName = 'Alert';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription };
