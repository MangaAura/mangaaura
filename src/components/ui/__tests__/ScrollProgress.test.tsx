import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ScrollProgress } from '../ScrollProgress';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ style, className }: any) => <div style={style} className={className} />,
  },
  useScroll: () => ({ scrollYProgress: { get: () => 0.5 } }),
  useSpring: (val: any) => val,
}));

describe('ScrollProgress', () => {
  it('renders progress bar', () => {
    const { container } = render(<ScrollProgress />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('has correct z-index', () => {
    const { container } = render(<ScrollProgress />);
    expect(container.firstChild).toHaveClass('z-[100]');
  });
});
