import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Label } from '../Label';

describe('Label', () => {
  it('renders text children', () => {
    render(<Label>Username</Label>);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('renders with htmlFor', () => {
    render(<Label htmlFor="email">Email</Label>);
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email');
  });

  it('applies custom className', () => {
    const { container } = render(<Label className="custom-label">Name</Label>);
    expect(container.firstChild).toHaveClass('custom-label');
  });
});
