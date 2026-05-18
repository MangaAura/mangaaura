'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

import { cn } from '@/lib/utils';

// Route name mappings
const routeNames: Record<string, string> = {
  '': 'Inicio',
  browse: 'explorar',
  library: 'Mi Biblioteca',
  rankings: 'rankings',
  community: 'comunidad',
  clans: 'clanes',
  collections: 'colecciones',
  messages: 'mensajes',
  notifications: 'notificaciones',
  profile: 'perfil',
  settings: 'configuración',
  admin: 'administración',
  moderation: 'moderación',
  manga: 'manga',
  chapter: 'capítulo',
  user: 'usuario',
  creator: 'creador',
  upload: 'subir',
  edit: 'editar',
  new: 'nuevo',
  search: 'buscar',
  help: 'ayuda',
  terms: 'términos',
  privacy: 'privacidad',
  dmca: 'DMCA',
  contact: 'contacto',
  report: 'reportar',
  achievements: 'logros',
  analytics: 'analíticas',
  dashboard: 'panel',
};

interface BreadcrumbItem {
  name: string;
  href: string;
  isLast: boolean;
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Remove query parameters
  const pathWithoutQuery = pathname.split('?')[0];
  const segments = pathWithoutQuery.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Inicio', href: '/', isLast: segments.length === 0 },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Check if it's a dynamic segment (UUID, number, etc.)
    const isDynamicSegment = 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || // UUID
      /^\d+$/.test(segment) || // Number
      (segment.length > 20); // Long string (likely ID)

    // Get display name
    let name = routeNames[segment.toLowerCase()];
    if (!name) {
      if (isDynamicSegment) {
        // Try to get context from previous segment
        const prevSegment = segments[index - 1];
        if (prevSegment === 'manga') name = 'detalle';
        else if (prevSegment === 'chapter') name = `Cap. ${segment}`;
        else if (prevSegment === 'user') name = 'perfil';
        else if (prevSegment === 'admin' || prevSegment === 'moderation') name = 'gestión';
        else name = 'detalle';
      } else {
        // Capitalize and clean
        name = segment
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
      }
    }

    breadcrumbs.push({
      name,
      href: currentPath,
      isLast: index === segments.length - 1,
    });
  });

  return breadcrumbs;
}

interface BreadcrumbsProps {
  className?: string;
  customItems?: { name: string; href: string }[];
}

export function Breadcrumbs({ className, customItems }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on home page
  if (pathname === '/') return null;

  const items = customItems 
    ? [
        { name: 'Inicio', href: '/', isLast: false },
        ...customItems.map((item, index) => ({
          ...item,
          isLast: index === customItems.length - 1,
        })),
      ]
    : generateBreadcrumbs(pathname);

  // JSON-LD structured data for breadcrumbs
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://inkverse.app'}${item.href}`,
    })),
  };

  return (
    <>
      <Script id="breadcrumb-schema" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav
        aria-label="Breadcrumb"
        className={cn(
          'w-full py-3 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)]/50',
          className
        )}
      >
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] mx-2 flex-shrink-0" />
              )}
              {item.isLast ? (
                <span
                  className="text-[var(--text-secondary)] font-medium truncate max-w-[200px] sm:max-w-xs"
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1',
                    index === 0 && 'flex items-center gap-1'
                  )}
                >
                  {index === 0 && <Home className="w-4 h-4" />}
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">
                    {item.name}
                  </span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

// Hook for generating breadcrumbs with custom names
export function useBreadcrumbs(dynamicNames?: Record<string, string>) {
  const pathname = usePathname();
  
  const generateItems = (): { name: string; href: string; isLast: boolean }[] => {
    const pathWithoutQuery = pathname.split('?')[0];
    const segments = pathWithoutQuery.split('/').filter(Boolean);

    const items: { name: string; href: string; isLast: boolean }[] = [
      { name: 'Inicio', href: '/', isLast: segments.length === 0 },
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Check for dynamic name override
      let name = dynamicNames?.[segment] || dynamicNames?.[currentPath];
      
      if (!name) {
        name = routeNames[segment.toLowerCase()];
      }
      
      if (!name) {
        const isDynamicSegment = 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
          /^\d+$/.test(segment) ||
          segment.length > 20;

        if (isDynamicSegment) {
          const prevSegment = segments[index - 1];
          if (prevSegment === 'manga') name = 'detalle';
          else if (prevSegment === 'chapter') name = `Cap. ${segment}`;
          else if (prevSegment === 'user') name = 'perfil';
          else if (prevSegment === 'admin' || prevSegment === 'moderation') name = 'gestión';
          else name = 'detalle';
        } else {
          name = segment
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
        }
      }

      items.push({
        name,
        href: currentPath,
        isLast: index === segments.length - 1,
      });
    });

    return items;
  };

  return { items: generateItems(), pathname };
}
