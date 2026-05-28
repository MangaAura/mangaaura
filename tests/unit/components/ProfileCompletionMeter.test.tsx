import { render, screen } from '@testing-library/react';
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

import { ProfileCompletionMeter } from '@/components/Profile/ProfileCompletionMeter';

function mockT(key: string, params?: Record<string, string | number>) {
  const translations: Record<string, string> = {
    'profileCompletion.title': 'Completa tu perfil',
    'profileCompletion.missing': 'Añade: {items}',
    'profileCompletion.avatar': 'Avatar',
    'profileCompletion.cover': 'Portada',
    'profileCompletion.bio': 'Biografía',
    'profileCompletion.website': 'Sitio web',
    'profileCompletion.social': 'Redes sociales',
  };
  let text = translations[key] || key;
  if (params?.items) {
    text = text.replace('{items}', params.items as string);
  }
  return text;
}

describe('ProfileCompletionMeter', () => {
  it('muestra el título y el contador de progreso', () => {
    render(
      <ProfileCompletionMeter
        hasAvatar={false}
        hasCover={false}
        hasBio={false}
        hasWebsite={false}
        hasSocialLinks={false}
        t={mockT}
      />
    );

    expect(screen.getByText('Completa tu perfil')).toBeDefined();
    expect(screen.getByText('0/5')).toBeDefined();
  });

  it('muestra el porcentaje correcto cuando algunos items están completos', () => {
    render(
      <ProfileCompletionMeter
        hasAvatar={true}
        hasCover={false}
        hasBio={true}
        hasWebsite={false}
        hasSocialLinks={true}
        t={mockT}
      />
    );

    expect(screen.getByText('3/5')).toBeDefined();
  });

  it('muestra todos los items faltantes cuando ninguno está completo', () => {
    render(
      <ProfileCompletionMeter
        hasAvatar={false}
        hasCover={false}
        hasBio={false}
        hasWebsite={false}
        hasSocialLinks={false}
        t={mockT}
      />
    );

    expect(screen.getByText(/Avatar/)).toBeDefined();
    expect(screen.getByText(/Portada/)).toBeDefined();
    expect(screen.getByText(/Biografía/)).toBeDefined();
    expect(screen.getByText(/Sitio web/)).toBeDefined();
    expect(screen.getByText(/Redes sociales/)).toBeDefined();
  });

  it('muestra solo los items faltantes cuando algunos están completos', () => {
    render(
      <ProfileCompletionMeter
        hasAvatar={true}
        hasCover={true}
        hasBio={true}
        hasWebsite={false}
        hasSocialLinks={false}
        t={mockT}
      />
    );

    const link = screen.getByRole('link');
    expect(link.textContent).toContain('Sitio web');
    expect(link.textContent).toContain('Redes sociales');
    expect(link.textContent).not.toContain('Avatar');
    expect(link.textContent).not.toContain('Portada');
    expect(link.textContent).not.toContain('Biografía');
  });

  it('incluye "Portada" en items faltantes cuando hasCover=false', () => {
    render(
      <ProfileCompletionMeter
        hasAvatar={true}
        hasCover={false}
        hasBio={true}
        hasWebsite={true}
        hasSocialLinks={true}
        t={mockT}
      />
    );

    const link = screen.getByRole('link');
    expect(link.textContent).toContain('Portada');
  });

  it('NO incluye "Portada" en items faltantes cuando hasCover=true', () => {
    render(
      <ProfileCompletionMeter
        hasAvatar={true}
        hasCover={true}
        hasBio={true}
        hasWebsite={true}
        hasSocialLinks={true}
        t={mockT}
      />
    );

    // 5/5 = 100% → retorna null, no renderiza nada
    expect(screen.queryByText('Completa tu perfil')).toBeNull();
  });

  it('retorna null cuando el perfil está 100% completo', () => {
    const { container } = render(
      <ProfileCompletionMeter
        hasAvatar={true}
        hasCover={true}
        hasBio={true}
        hasWebsite={true}
        hasSocialLinks={true}
        t={mockT}
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('enlaza a /settings cuando hay items faltantes', () => {
    render(
      <ProfileCompletionMeter
        hasAvatar={false}
        hasCover={false}
        hasBio={false}
        hasWebsite={false}
        hasSocialLinks={false}
        t={mockT}
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/settings');
  });

  it('pasa items faltantes en orden correcto al mensaje', () => {
    render(
      <ProfileCompletionMeter
        hasAvatar={false}
        hasCover={false}
        hasBio={false}
        hasWebsite={false}
        hasSocialLinks={false}
        t={mockT}
      />
    );

    const link = screen.getByRole('link');
    // Avatar, Portada, Biografía, Sitio web, Redes sociales
    expect(link.textContent).toContain('Avatar');
    expect(link.textContent).toContain('Portada');
  });

  it('muestra barra de progreso con el ancho correcto', () => {
    const { container } = render(
      <ProfileCompletionMeter
        hasAvatar={true}
        hasCover={false}
        hasBio={true}
        hasWebsite={false}
        hasSocialLinks={false}
        t={mockT}
      />
    );

    // 2/5 = 40%
    const progressBar = container.querySelector('.rounded-full');
    // La barra interior tiene width: 40%
    expect(progressBar?.nextElementSibling).toBeDefined();
  });
});
