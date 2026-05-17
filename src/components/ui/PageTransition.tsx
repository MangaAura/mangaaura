'use client';

import { motion, useReducedMotion } from 'framer-motion';

const pageTransition = {
  duration: 0.2,
  ease: [0.4, 0, 0.2, 1] as const,
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  if (shouldReduceMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}
