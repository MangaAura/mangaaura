import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
          default: 'bg-[var(--primary)] text-[var(--text-inverse)] hover:bg-[var(--primary-hover)] focus-visible:ring-[var(--primary)]',
          destructive: 'bg-[var(--error)] text-[var(--text-inverse)] hover:opacity-90 focus-visible:ring-[var(--error)]',
          outline: 'border border-[var(--border)] bg-transparent hover:bg-[var(--surface-sunken)] text-[var(--text-primary)]',
          secondary: 'bg-[var(--surface-sunken)] text-[var(--text-primary)] hover:bg-[var(--surface)]',
          ghost: 'hover:bg-[var(--surface-sunken)] text-[var(--text-primary)]',
          link: 'text-[var(--primary)] underline-offset-4 hover:underline',
          ink: 'bg-gradient-to-r from-[var(--accent-purple)] to-[var(--primary)] text-[var(--text-inverse)] hover:opacity-90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
}

function Button({ className, variant, size, isLoading, asChild: _asChild, children, ref, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Cargando...
        </>
      ) : (
        children
      )}
    </button>
  );
}

Button.displayName = 'Button';

export { Button, buttonVariants };
