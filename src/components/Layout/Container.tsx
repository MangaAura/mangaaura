import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'small' | 'medium' | 'large' | 'full';
}

const sizes = {
  small: 'max-w-3xl',
  medium: 'max-w-4xl',
  default: 'max-w-5xl',
  large: 'max-w-6xl',
  full: 'max-w-7xl',
};

export function Container({
  children,
  className,
  size = 'default',
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        sizes[size],
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-h-screen', className)}>
      <main className="py-8">{children}</main>
    </div>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('py-8', className)}>
      {children}
    </section>
  );
}
