import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders with default variant', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('h-4');
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('renders with heading variant', () => {
    const { container } = render(<Skeleton variant="heading" />);
    expect(container.firstChild).toHaveClass('h-8');
    expect(container.firstChild).toHaveClass('w-3/4');
  });

  it('renders with avatar variant', () => {
    const { container } = render(<Skeleton variant="avatar" />);
    expect(container.firstChild).toHaveClass('h-12');
    expect(container.firstChild).toHaveClass('w-12');
    expect(container.firstChild).toHaveClass('rounded-full');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
