import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders default empty state', () => {
    render(<EmptyState title="Sin contenido" description="No hay nada que mostrar aquí" />);
    expect(screen.getByText('Sin contenido')).toBeInTheDocument();
    expect(screen.getByText('No hay nada que mostrar aquí')).toBeInTheDocument();
  });

  it('renders library preset', () => {
    render(<EmptyState preset="library" title="Tu biblioteca está vacía" description="Agrega manga a tu biblioteca para verlo aquí" />);
    expect(screen.getByText('Tu biblioteca está vacía')).toBeInTheDocument();
    expect(screen.getByText('Agrega manga a tu biblioteca para verlo aquí')).toBeInTheDocument();
  });

  it('renders search preset', () => {
    render(<EmptyState preset="search" title="Sin resultados" />);
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('renders error preset', () => {
    render(<EmptyState preset="error" title="Algo salió mal" />);
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(
      <EmptyState
        preset="custom"
        title="Custom Title"
        description="Custom description"
      />
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });

  it('renders action button when action is provided', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="Test"
        action={{
          label: 'Click me',
          onClick: handleClick,
        }}
      />
    );
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders action link when href is provided', () => {
    render(
      <EmptyState
        title="Test"
        action={{
          label: 'Go to page',
          href: '/test',
        }}
      />
    );
    const link = screen.getByText('Go to page');
    expect(link.closest('a')).toHaveAttribute('href', '/test');
  });
});
