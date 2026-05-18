import Image from 'next/image';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface AvatarProps {
  className?: string;
  children?: React.ReactNode;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
    >
      {children}
    </div>
  )
);
Avatar.displayName = 'Avatar';

interface AvatarImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ src, alt, className }, ref) => {
    if (!src) return null;
    return (
      <Image
        ref={ref as React.Ref<HTMLImageElement>}
        src={src}
        alt={alt || ''}
        fill
        className={cn('aspect-square h-full w-full object-cover', className)}
      />
    );
  }
);
AvatarImage.displayName = 'AvatarImage';

interface AvatarFallbackProps {
  className?: string;
  children?: React.ReactNode;
}

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-[var(--surface-sunken)] text-[var(--text-secondary)] font-medium',
        className
      )}
    >
      {children}
    </div>
  )
);
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
