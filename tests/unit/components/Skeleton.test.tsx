import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Skeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with default variant', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('.h-4')).toBeDefined();
    expect(container.querySelector('.w-full')).toBeDefined();
  });

  it('renders with text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    expect(container.querySelector('.h-4')).toBeDefined();
    expect(container.querySelector('.w-full')).toBeDefined();
  });

  it('renders with heading variant', () => {
    const { container } = render(<Skeleton variant="heading" />);
    expect(container.querySelector('.h-8')).toBeDefined();
    // w-3/4 - slash needs escaping in CSS selector
    expect(container.querySelector('.w-3\\/4')).toBeDefined();
  });

  it('renders with avatar variant', () => {
    const { container } = render(<Skeleton variant="avatar" />);
    expect(container.querySelector('.h-12')).toBeDefined();
    expect(container.querySelector('.w-12')).toBeDefined();
    expect(container.querySelector('.rounded-full')).toBeDefined();
  });

  it('renders with image variant', () => {
    const { container } = render(<Skeleton variant="image" />);
    // aspect-[3/4] - brackets and slash need escaping
    expect(container.querySelector('.aspect-\\[3\\/4\\]')).toBeDefined();
  });

  it('renders with card variant', () => {
    const { container } = render(<Skeleton variant="card" />);
    expect(container.querySelector('.h-64')).toBeDefined();
    expect(container.querySelector('.w-full')).toBeDefined();
  });

  it('renders with button variant', () => {
    const { container } = render(<Skeleton variant="button" />);
    expect(container.querySelector('.h-10')).toBeDefined();
    expect(container.querySelector('.w-24')).toBeDefined();
  });

  it('renders with badge variant', () => {
    const { container } = render(<Skeleton variant="badge" />);
    expect(container.querySelector('.h-5')).toBeDefined();
    expect(container.querySelector('.w-16')).toBeDefined();
  });

  it('renders with stat variant', () => {
    const { container } = render(<Skeleton variant="stat" />);
    expect(container.querySelector('.h-8')).toBeDefined();
    expect(container.querySelector('.w-20')).toBeDefined();
  });

  it('renders with hero variant', () => {
    const { container } = render(<Skeleton variant="hero" />);
    // h-[70vh] - brackets need escaping
    expect(container.querySelector('.h-\\[70vh\\]')).toBeDefined();
  });

  it('accepts custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeDefined();
  });

  it('has accessible label', () => {
    render(<Skeleton variant="text" />);
    expect(screen.getByText('Cargando...')).toBeDefined();
  });
});
