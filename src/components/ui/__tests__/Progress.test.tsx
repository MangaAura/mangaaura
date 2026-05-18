import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Progress } from '../Progress';

describe('Progress', () => {
  it('renders with default value', () => {
    const { container } = render(<Progress value={50} />);
    const inner = container.querySelector('[style*="width: 50%"]');
    expect(inner).toBeDefined();
  });

  it('renders with 0 value', () => {
    const { container } = render(<Progress value={0} />);
    const inner = container.querySelector('[style*="width: 0%"]');
    expect(inner).toBeDefined();
  });

  it('renders with 100 value', () => {
    const { container } = render(<Progress value={100} />);
    const inner = container.querySelector('[style*="width: 100%"]');
    expect(inner).toBeDefined();
  });

  it('clamps value to max', () => {
    const { container } = render(<Progress value={200} />);
    const inner = container.querySelector('[style*="width: 100%"]');
    expect(inner).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(<Progress value={50} className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });
});
