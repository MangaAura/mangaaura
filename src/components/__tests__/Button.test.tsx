import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    const { container } = render(<Button>Default</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-[var(--primary)]');
    expect(button).toHaveClass('text-[var(--text-inverse)]');
  });

  it('applies destructive variant styles', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-[var(--error)]');
  });

  it('applies outline variant styles', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('border-[var(--border)]');
  });

  it('applies different size variants', () => {
    const { container: sm } = render(<Button size="sm">Small</Button>);
    const smButton = sm.querySelector('button');
    expect(smButton).toHaveClass('h-9');
    expect(smButton).toHaveClass('px-3');

    const { container: lg } = render(<Button size="lg">Large</Button>);
    const lgButton = lg.querySelector('button');
    expect(lgButton).toHaveClass('h-11');
    expect(lgButton).toHaveClass('px-8');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.getByText('Cargando...')).toBeDisabled();
  });

  it('renders with ink variant (gradient)', () => {
    const { container } = render(<Button variant="ink">Ink</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-gradient-to-r');
    expect(button).toHaveClass('from-[var(--accent-purple)]');
    expect(button).toHaveClass('to-[var(--primary)]');
  });

it('forwards ref correctly', () => {
const ref = React.createRef<HTMLButtonElement>();
render(<Button {...({ref} as any)}>Ref Test</Button>);
expect(ref.current).toBeInstanceOf(HTMLButtonElement);
});

  it('renders with icon size', () => {
    const { container } = render(
      <Button size="icon">
        <span data-testid="icon">★</span>
      </Button>
    );
    const button = container.querySelector('button');
    expect(button).toHaveClass('h-10');
    expect(button).toHaveClass('w-10');
  });

  it('applies custom className', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('renders as link variant', () => {
    const { container } = render(<Button variant="link">Link</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('text-[var(--primary)]');
    expect(button).toHaveClass('underline-offset-4');
  });
});
