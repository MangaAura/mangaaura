'use client';

import { useReducedMotion } from 'framer-motion';
import { useCallback, useRef, type ReactNode, type CSSProperties } from 'react';

interface TiltCardProps {
  children: ReactNode;
  maxRotation?: number;
  className?: string;
  style?: CSSProperties;
}

export function TiltCard({
  children,
  maxRotation = 10,
  className,
  style,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleMouse = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current || shouldReduceMotion) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -maxRotation;
      const rotateY = ((x - centerX) / centerX) * maxRotation;
      ref.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
    },
    [maxRotation, shouldReduceMotion],
  );

  const handleLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform =
      'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className={className}
      style={{ ...style, transformStyle: 'preserve-3d' } as CSSProperties}
    >
      {children}
    </div>
  );
}
