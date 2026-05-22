import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { EmptyState, EmptyLibrary, EmptySearch, EmptyNotifications, EmptyFollowing, EmptyMessages, ErrorState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders with default props', () => {
    render(<EmptyState title="Sin contenido" />);
    expect(screen.getByText('Sin contenido')).toBeDefined();
  });

  it('renders with description', () => {
    render(
      <EmptyState title="Vacío" description="No hay nada que mostrar" />
    );
    expect(screen.getByText('No hay nada que mostrar')).toBeDefined();
  });

  it('renders action button with onClick', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="Vacío"
        action={{ label: 'Click me', onClick: handleClick }}
      />
    );
    const button = screen.getByText('Click me');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders action button with href link', () => {
    render(
      <EmptyState
        title="Vacío"
        action={{ label: 'Ir a explorar', href: '/explore' }}
      />
    );
    const link = screen.getByText('Ir a explorar').closest('a');
    expect(link).toHaveAttribute('href', '/explore');
  });

  it('renders secondary action', () => {
    render(
      <EmptyState
        title="Vacío"
        action={{ label: 'Primary', href: '/primary' }}
        secondaryAction={{ label: 'Secondary', href: '/secondary' }}
      />
    );
    expect(screen.getByText('Primary')).toBeDefined();
    expect(screen.getByText('Secondary')).toBeDefined();
  });

  it('renders with custom icon', () => {
    render(
      <EmptyState
        title="Con icono"
        icon={<span data-testid="custom-icon">🔔</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeDefined();
  });

  it('applies size classes correctly', () => {
    const { container } = render(
      <EmptyState title="Pequeño" size="sm" />
    );
    expect(container.querySelector('.py-8')).toBeDefined();
  });
});

describe('EmptyLibrary', () => {
  it('renders library empty state with correct text', () => {
    render(<EmptyLibrary />);
    expect(screen.getByText('Tu biblioteca está vacía')).toBeDefined();
    expect(screen.getByText('Explorar mangas')).toBeDefined();
  });

  it('links to explore page', () => {
    render(<EmptyLibrary />);
    const link = screen.getByText('Explorar mangas').closest('a');
    expect(link).toHaveAttribute('href', '/explore');
  });
});

describe('EmptySearch', () => {
  it('renders with search query', () => {
    render(<EmptySearch query="naruto" />);
    expect(screen.getByText(/naruto/)).toBeDefined();
    expect(screen.getByText('Ver todos los mangas')).toBeDefined();
  });
});

describe('EmptyNotifications', () => {
  it('renders empty notifications', () => {
    render(<EmptyNotifications />);
    expect(screen.getByText('Sin notificaciones')).toBeDefined();
    expect(
      screen.getByText(
        'No tienes notificaciones nuevas. Te avisaremos cuando haya novedades.'
      )
    ).toBeDefined();
  });
});

describe('EmptyFollowing', () => {
  it('renders empty following state', () => {
    render(<EmptyFollowing />);
    expect(screen.getByText('No sigues a nadie')).toBeDefined();
    expect(screen.getByText('Descubrir creadores')).toBeDefined();
  });
});

describe('EmptyMessages', () => {
  it('renders empty messages state', () => {
    render(<EmptyMessages />);
    expect(screen.getByText('Sin mensajes')).toBeDefined();
    expect(screen.getByText('Nuevo mensaje')).toBeDefined();
  });
});

describe('ErrorState', () => {
  it('renders error message', () => {
    render(<ErrorState message="Algo salió mal" />);
    const elements = screen.getAllByText('Algo salió mal');
    expect(elements.length).toBeGreaterThanOrEqual(1);
    expect(elements[0]).toBeDefined();
  });

  it('renders retry button when onRetry provided', () => {
    const handleRetry = vi.fn();
    render(<ErrorState onRetry={handleRetry} />);
    const retryButton = screen.getByText('Intentar de nuevo');
    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledOnce();
  });

  it('shows default error message when none provided', () => {
    render(<ErrorState />);
    expect(
      screen.getByText('Hubo un error al cargar el contenido.')
    ).toBeDefined();
  });
});
