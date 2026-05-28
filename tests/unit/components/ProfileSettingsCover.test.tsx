import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock next-auth ───────────────────────────────────────────────────
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { name: 'Test User', image: null } },
    update: vi.fn(),
  })),
}));

// ── Mock framer-motion ───────────────────────────────────────────────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ── Mock extractApiError ─────────────────────────────────────────────
vi.mock('@/lib/extract-api-error', () => ({
  extractApiError: vi.fn().mockResolvedValue({ message: 'Error de prueba' }),
}));

// ── Mock URL.createObjectURL / revokeObjectURL ────────────────────────
const fakeObjectUrl = 'blob:mock-url-123';
vi.spyOn(URL, 'createObjectURL').mockReturnValue(fakeObjectUrl);
vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

// ── Mock Avatar components ────────────────────────────────────────────
vi.mock('@/components/ui/Avatar', () => ({
  Avatar: ({ children, className }: any) => (
    <div className={className} data-testid="avatar">
      {children}
    </div>
  ),
  AvatarFallback: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  ),
  AvatarImage: ({ src }: any) => (src ? <img src={src} alt="avatar" /> : null),
}));

// ── Mock Input ─────────────────────────────────────────────────────────
vi.mock('@/components/ui/Input', () => ({
  Input: (props: any) => <input {...props} />,
}));

// ── Mock Label ─────────────────────────────────────────────────────────
vi.mock('@/components/ui/Label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

// ── Mock Button ─────────────────────────────────────────────────────────
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, disabled, isLoading, variant, size, className, type }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={className}
      type={type}
      data-variant={variant}
      data-size={size}
      data-loading={isLoading || undefined}
    >
      {isLoading ? 'Cargando...' : children}
    </button>
  ),
}));

import { ProfileSettings } from '@/components/Settings/ProfileSettings';

const baseUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  avatarUrl: null,
  coverUrl: null,
  bio: null,
  website: null,
  socialLinks: null,
};

describe('ProfileSettings — Cover section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  it('muestra "Sin banner" cuando no hay coverUrl', () => {
    render(<ProfileSettings user={baseUser} />);

    expect(screen.getByText('Sin banner')).toBeDefined();
  });

  it('muestra el botón "Subir" cuando no hay cover', () => {
    render(<ProfileSettings user={baseUser} />);

    expect(screen.getByText('Subir')).toBeDefined();
  });

  it('NO muestra el botón "Eliminar" cuando no hay cover', () => {
    render(<ProfileSettings user={baseUser} />);

    expect(screen.queryByText('Eliminar')).toBeNull();
  });

  it('muestra imagen de preview cuando hay coverUrl', () => {
    const userWithCover = { ...baseUser, coverUrl: 'https://example.com/cover.jpg' };
    render(<ProfileSettings user={userWithCover} />);

    const coverImg = screen.getByAltText('Banner');
    expect(coverImg).toBeDefined();
    expect(coverImg).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  it('muestra el botón "Cambiar" cuando hay cover', () => {
    const userWithCover = { ...baseUser, coverUrl: 'https://example.com/cover.jpg' };
    render(<ProfileSettings user={userWithCover} />);

    expect(screen.getByText('Cambiar')).toBeDefined();
  });

  it('muestra el botón "Eliminar" cuando hay cover', () => {
    const userWithCover = { ...baseUser, coverUrl: 'https://example.com/cover.jpg' };
    render(<ProfileSettings user={userWithCover} />);

    expect(screen.getByText('Eliminar')).toBeDefined();
  });

  it('tiene un input file oculto para subir cover', () => {
    render(<ProfileSettings user={baseUser} />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    // El primer file input es para avatar, el segundo para cover
    expect(fileInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('el botón Subir/Cambiar dispara el click del input file', () => {
    render(<ProfileSettings user={baseUser} />);

    const subirBtn = screen.getByText('Subir');
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const coverInput = fileInputs[1]; // segundo file input
    const clickSpy = vi.spyOn(coverInput, 'click');

    fireEvent.click(subirBtn);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('el botón Eliminar dispara fetch DELETE', () => {
    const userWithCover = { ...baseUser, coverUrl: 'https://example.com/cover.jpg' };
    (global.fetch as any).mockResolvedValue({ ok: true });
    render(<ProfileSettings user={userWithCover} />);

    const eliminarBtn = screen.getByText('Eliminar');
    fireEvent.click(eliminarBtn);

    expect(global.fetch).toHaveBeenCalledWith('/api/upload/profile-cover', { method: 'DELETE' });
  });

  it('valida formato de archivo inválido para cover', () => {
    render(<ProfileSettings user={baseUser} />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const coverInput = fileInputs[1];

    // Crear un archivo con formato no soportado
    const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' });
    fireEvent.change(coverInput, { target: { files: [invalidFile] } });

    expect(screen.getByText(/Formato no soportado/)).toBeDefined();
  });

  it('valida tamaño de archivo demasiado grande para cover', () => {
    render(<ProfileSettings user={baseUser} />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const coverInput = fileInputs[1];

    // Crear un archivo de 6MB
    const bigFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(coverInput, { target: { files: [bigFile] } });

    expect(screen.getByText(/Archivo demasiado grande/)).toBeDefined();
  });

  it('muestra mensaje de error cuando el servidor rechaza la subida', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Error al subir el banner'));
    render(<ProfileSettings user={baseUser} />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const coverInput = fileInputs[1];

    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(coverInput, { target: { files: [validFile] } });

    // Esperar a que el microtask del fetch se procese
    await vi.waitFor(() => {
      expect(screen.getByText(/Error al subir el banner/)).toBeDefined();
    });
  });

  it('muestra spinner de carga mientras sube la cover', () => {
    // Hacer que fetch nunca resuelva para mantener el estado de carga
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<ProfileSettings user={baseUser} />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const coverInput = fileInputs[1];

    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(coverInput, { target: { files: [validFile] } });

    // Debe mostrar el spinner de carga en el área del cover
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeDefined();
  });

  it('acepta formatos válidos: webp, jpeg, png, avif', () => {
    render(<ProfileSettings user={baseUser} />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const coverInput = fileInputs[1];

    // Verificar el atributo accept del input
    expect(coverInput).toHaveAttribute(
      'accept',
      'image/webp,image/jpeg,image/png,image/avif'
    );
  });

  it('muestra el texto específico del banner en la sección cover', () => {
    render(<ProfileSettings user={baseUser} />);

    expect(
      screen.getByText(/1500×500/)
    ).toBeDefined();
  });
});
