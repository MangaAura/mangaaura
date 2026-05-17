'use client';

import { motion, type Variants } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';

const animations: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  slideInLeft: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  },
  slideInRight: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
  },
};

interface AnimatedContainerProps {
  children: React.ReactNode;
  animation?: keyof typeof animations;
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
  const shouldReduceMotion = useReducedMotion();

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.5,
    delay: shouldReduceMotion ? 0 : delay,
    ease: [0.25, 0.1, 0.25, 1] as const,
  };

  if (viewport) {
    const viewportOpts =
      typeof viewport === 'boolean'
        ? { once: true, margin: '-50px' }
        : { once: viewport.once ?? true, margin: viewport.margin ?? '-50px' };

    return (
      <motion.div
        variants={animations[animation]}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOpts}
        transition={transition}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={animations[animation]}
      initial="hidden"
      animate="visible"
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
