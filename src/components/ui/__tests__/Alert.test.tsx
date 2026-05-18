import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Alert } from '../Alert';

describe('Alert', () => {
  it('renders children', () => {
    render(<Alert>This is an alert</Alert>);
    expect(screen.getByText('This is an alert')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container, rerender } = render(<Alert variant="default">Default</Alert>);
    expect(container.firstChild).toHaveClass('border-[var(--border)]');

    rerender(<Alert variant="destructive">Destructive</Alert>);
    expect(container.firstChild).toHaveClass('border-[var(--error)]');

    rerender(<Alert variant="warning">Warning</Alert>);
    expect(container.firstChild).toHaveClass('border-yellow-500/50');
  });

  it('applies custom className', () => {
    const { container } = render(<Alert className="custom-alert">Styled</Alert>);
    expect(container.firstChild).toHaveClass('custom-alert');
  });
});
