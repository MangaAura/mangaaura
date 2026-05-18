import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card><p data-testid="child">Content</p></Card>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-card-class" />);
    expect(container.firstChild).toHaveClass('custom-card-class');
  });

  it('applies base card styles', () => {
    const { container } = render(<Card />);
    const card = container.firstChild;
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('shadow-sm');
  });

  it('applies interactive styles when interactive prop is true', () => {
    const { container } = render(<Card interactive />);
    const card = container.firstChild;
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('transition-all');
    expect(card).toHaveClass('hover:-translate-y-0.5');
  });

  it('renders as non-interactive by default', () => {
    const { container } = render(<Card />);
    const card = container.firstChild;
    expect(card).not.toHaveClass('cursor-pointer');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('renders children correctly', () => {
    render(<CardHeader><h2 data-testid="header">Header Content</h2></CardHeader>);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardHeader className="custom-header" />);
    expect(container.firstChild).toHaveClass('custom-header');
  });

  it('applies flex column layout', () => {
    const { container } = render(<CardHeader />);
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('flex-col');
  });
});

describe('CardTitle', () => {
  it('renders children correctly', () => {
    render(<CardTitle>Sample Title</CardTitle>);
    expect(screen.getByText('Sample Title')).toBeInTheDocument();
  });

  it('renders as h3 element', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText('Title').tagName).toBe('H3');
  });

  it('applies title typography styles', () => {
    const { container } = render(<CardTitle />);
    expect(container.firstChild).toHaveClass('text-2xl');
    expect(container.firstChild).toHaveClass('font-semibold');
    expect(container.firstChild).toHaveClass('tracking-tight');
  });
});

describe('CardDescription', () => {
  it('renders children correctly', () => {
    render(<CardDescription>Description text here</CardDescription>);
    expect(screen.getByText('Description text here')).toBeInTheDocument();
  });

  it('renders as paragraph element', () => {
    render(<CardDescription>Desc</CardDescription>);
    expect(screen.getByText('Desc').tagName).toBe('P');
  });
});

describe('CardContent', () => {
  it('renders children correctly', () => {
    render(<CardContent><span data-testid="content">Content Body</span></CardContent>);
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('applies padding classes', () => {
    const { container } = render(<CardContent />);
    expect(container.firstChild).toHaveClass('p-6');
    expect(container.firstChild).toHaveClass('pt-0');
  });
});

describe('CardFooter', () => {
  it('renders children correctly', () => {
    render(<CardFooter><button data-testid="action">Action</button></CardFooter>);
    expect(screen.getByTestId('action')).toBeInTheDocument();
  });

  it('applies flex layout', () => {
    const { container } = render(<CardFooter />);
    expect(container.firstChild).toHaveClass('flex');
    expect(container.firstChild).toHaveClass('items-center');
  });
});
