'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const pageVariants = {
  initial: (reduceMotion: boolean) => ({
    opacity: reduceMotion ? 1 : 0,
  }),
  animate: { opacity: 1 },
  exit: (reduceMotion: boolean) => ({
    opacity: reduceMotion ? 1 : 0,
  }),
};

const pageTransition = (reduceMotion: boolean) => ({
  duration: reduceMotion ? 0 : 0.3,
  ease: [0.4, 0, 0.2, 1] as const,
});

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        custom={shouldReduceMotion}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition(shouldReduceMotion)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
