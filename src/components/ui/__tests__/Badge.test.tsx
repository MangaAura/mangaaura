import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('bg-[var(--primary)]');
    expect(container.firstChild).toHaveClass('text-[var(--text-inverse)]');
  });

  it('applies secondary variant classes', () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(container.firstChild).toHaveClass('bg-[var(--surface-sunken)]');
    expect(container.firstChild).toHaveClass('text-[var(--text-primary)]');
  });

  it('applies outline variant classes', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>);
    expect(container.firstChild).toHaveClass('text-[var(--text-secondary)]');
    expect(container.firstChild).toHaveClass('border-[var(--border)]');
  });

  it('applies destructive variant classes', () => {
    const { container } = render(<Badge variant="destructive">Destructive</Badge>);
    expect(container.firstChild).toHaveClass('bg-[var(--error)]/10');
    expect(container.firstChild).toHaveClass('text-[var(--error)]');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-badge">Styled</Badge>);
    expect(container.firstChild).toHaveClass('custom-badge');
  });
});
