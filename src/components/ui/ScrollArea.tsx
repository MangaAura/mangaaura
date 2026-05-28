import * as React from 'react';

import { cn } from '@/lib/utils';

interface ScrollAreaProps {
  className?: string;
  children?: React.ReactNode;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, onScroll }, ref) => (
    <div
      ref={ref}
      onScroll={onScroll}
      className={cn('relative overflow-auto', className)}
    >
      {children}
    </div>
  )
);
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
