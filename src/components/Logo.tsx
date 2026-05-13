import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8 text-lg', text: 'text-lg' },
    md: { icon: 'w-10 h-10 text-xl', text: 'text-xl' },
    lg: { icon: 'w-12 h-12 text-2xl', text: 'text-2xl' },
  };

  return (
    <Link href="/" className={cn('flex items-center gap-3 group', className)}>
      <div className={cn(
        'bg-gradient-to-br from-[var(--primary)] to-[var(--accent-purple)] rounded-xl flex items-center justify-center font-bold text-[var(--text-inverse)] shadow-lg transition-transform group-hover:scale-105',
        sizes[size].icon
      )}>
        I
      </div>
      {showText && (
        <span className={cn(
          'font-bold text-[var(--text-primary)] transition-colors',
          sizes[size].text
        )}>
          InkVerse
        </span>
      )}
    </Link>
  );
}
