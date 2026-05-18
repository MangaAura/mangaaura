import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { Switch } from '../Switch';

describe('Switch', () => {
  it('renders with aria-label', () => {
    render(<Switch aria-label="Toggle setting" />);
    expect(screen.getByRole('switch')).toBeDefined();
  });

  it('starts unchecked by default', () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('renders with checked state', () => {
    render(<Switch checked aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('fires onCheckedChange when clicked', () => {
    const handleChange = vi.fn();
    render(<Switch onCheckedChange={handleChange} aria-label="Toggle" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('applies disabled state', () => {
    render(<Switch disabled aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('does not fire onCheckedChange when disabled', () => {
    const handleChange = vi.fn();
    render(<Switch disabled onCheckedChange={handleChange} aria-label="Toggle" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<Switch className="custom-switch" aria-label="Toggle" />);
    expect(container.firstChild).toHaveClass('custom-switch');
  });
});
