import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const textareaVariants = cva(
  'flex min-h-[80px] w-full rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      hasError: {
        false: '',
        true: 'border-[var(--error)] focus:ring-[var(--error)]',
      },
    },
    defaultVariants: {
      hasError: false,
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const errorId = React.useId();
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          {...props}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(textareaVariants({ hasError: !!error }), className)}
        />
        {error && (
          <p id={errorId} className="mt-1 text-xs text-[var(--error)]" role="alert">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
