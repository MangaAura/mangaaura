'use client';

import { useEffect, useRef, useState } from 'react';

const ANIMATION_CLASSES: Record<string, string> = {
  fadeIn: 'animate-ac-fade-in',
  fadeInUp: 'animate-ac-fade-in-up',
  fadeInDown: 'animate-ac-fade-in-down',
  scaleIn: 'animate-ac-scale-in',
  slideInLeft: 'animate-ac-slide-in-left',
  slideInRight: 'animate-ac-slide-in-right',
};

interface AnimatedContainerProps {
  children: React.ReactNode;
  animation?: keyof typeof ANIMATION_CLASSES;
  delay?: number;
  className?: string;
  viewport?: boolean | { once?: boolean; margin?: string };
}

export function AnimatedContainer({
  children,
  animation = 'fadeInUp',
  delay = 0,
  className,
  viewport,
}: AnimatedContainerProps) {
  const [isVisible, setIsVisible] = useState(!viewport);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewport || !ref.current) return;

    const viewportOpts =
      typeof viewport === 'boolean'
        ? { once: true, margin: '-50px' }
        : { once: viewport.once ?? true, margin: viewport.margin ?? '-50px' };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (viewportOpts.once) observer.disconnect();
        } else if (!viewportOpts.once) {
          setIsVisible(false);
        }
      },
      { rootMargin: viewportOpts.margin },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [viewport]);

  const animClass = ANIMATION_CLASSES[animation];

  return (
    <div
      ref={ref}
      className={`${className ?? ''}${isVisible ? ` ${animClass}` : ''}`}
      style={{ animationDelay: isVisible ? `${delay}s` : '0s' }}
    >
      {children}
    </div>
  );
}
