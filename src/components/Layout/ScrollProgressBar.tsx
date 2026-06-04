'use client';

import { useEffect, useRef, useState } from 'react';

export function ScrollProgressBar() {
  const [visible, setVisible] = useState(false);
  const progressRef = useRef(0);

  useEffect(() => {
    let rafId: number;

    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      progressRef.current = progress;
    }

    function rafLoop() {
      const bar = document.getElementById('scroll-progress-bar');
      if (bar) {
        const p = progressRef.current;
        bar.style.transform = `scaleX(${p})`;
        if (p > 0.02 && !visible) setVisible(true);
        if (p < 0.01 && visible) setVisible(false);
      }
      rafId = requestAnimationFrame(rafLoop);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    rafId = requestAnimationFrame(rafLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      id="scroll-progress-bar"
      className="fixed top-0 left-0 right-0 h-0.5 z-[60] origin-left bg-gradient-to-r from-[var(--primary)] to-[var(--accent-purple)]"
      style={{ transform: 'scaleX(0)', transition: 'transform 0.1s linear' }}
    />
  );
}
