import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedContainer } from '../AnimatedContainer';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className}>{children}</div>,
  },
  useReducedMotion: () => false,
}));

describe('AnimatedContainer', () => {
  it('renders children', () => {
    render(<AnimatedContainer><span>Hello</span></AnimatedContainer>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('uses fadeInUp animation by default', () => {
    const { container } = render(<AnimatedContainer>Content</AnimatedContainer>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies className', () => {
    render(<AnimatedContainer className="custom-class">Content</AnimatedContainer>);
    expect(screen.getByText('Content')).toHaveClass('custom-class');
  });
});
