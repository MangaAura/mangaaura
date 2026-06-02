'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      if (v > 0.02 && !visible) setVisible(true);
      if (v < 0.01 && visible) setVisible(false);
    });
    return () => unsubscribe();
  }, [scrollYProgress, visible]);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 z-[60] origin-left bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]"
      style={{ scaleX }}
    />
  );
}
