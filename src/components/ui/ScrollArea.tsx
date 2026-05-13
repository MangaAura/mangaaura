import * as React from 'react';
import { cn } from '@/lib/utils';

interface ScrollAreaProps {
  className?: string;
  children?: React.ReactNode;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn('relative overflow-auto', className)}
    >
      {children}
    </div>
  )
);
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
