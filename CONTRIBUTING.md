# Contribuyendo a MangaAura

¡Gracias por tu interés en contribuir a MangaAura! Este documento te guiará en el proceso de contribución.

## Código de Conducta

Este proyecto y todos los participantes están gobernados por nuestro [Código de Conducta](CODE_OF_CONDUCT.md). Al participar, se espera que mantengas este código.

## ¿Cómo puedo contribuir?

### Reportar Bugs

Antes de crear un issue:

1. Verifica si el bug ya fue reportado
2. Usa el template de bug report
3. Incluye:
   - Versión de Node.js y npm
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si aplica
   - Logs de error

### Sugerir Features

1. Usa el template de feature request
2. Describe el problema que resuelve
3. Explica la solución propuesta
4. Considera alternativas

### Pull Requests

1. **Fork** el repositorio
2. **Crea una rama** (`git checkout -b feature/awesome-feature`)
3. **Commit** tus cambios (`git commit -m 'feat: add awesome feature'`)
4. **Push** a la rama (`git push origin feature/awesome-feature`)
5. Abre un **Pull Request**

## Flujo de Desarrollo

### Setup del entorno

```bash
# Clonar tu fork
git clone https://github.com/YOUR_USERNAME/mangaaura.git
cd mangaaura

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Generar Prisma client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run dev
```

### Convenciones de Código

#### TypeScript

- Usa tipos explícitos para parámetros de funciones
- Evita `any`
- Usa interfaces para objetos complejos
- Documenta funciones públicas con JSDoc

```typescript
// ✅ Bueno
interface UserProps {
  id: string;
  email: string;
  name?: string;
}

function getUserById(id: string): Promise<UserProps | null> {
  // ...
}

// ❌ Evitar
function getUser(id: any) {
  // ...
}
```

#### Estilo de Código

- Usa **prettier** para formateo
- Sigue las reglas de **ESLint**
- Nombres descriptivos en camelCase
- Componentes en PascalCase
- Constantes en UPPER_SNAKE_CASE

```typescript
// ✅ Bueno
const MAX_RETRY_COUNT = 3;

function calculateTotalPrice(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

function UserProfile({ user }: UserProfileProps) {
  return <div>{user.name}</div>;
}

// ❌ Evitar
const maxretry = 3;
function calc(items: any[]) { return items.reduce((s, i) => s + i.p, 0); }
function userprofile(props: any) { return <div>{props.user.name}</div>; }
```

#### Commits

Usa [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(alcance): descripción

[cuerpo opcional]

[footer opcional]
```

Tipos:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato (sin cambio de código)
- `refactor`: Refactorización
- `perf`: Performance
- `test`: Tests
- `chore`: Mantenimiento

Ejemplos:
```
feat(auth): add password reset functionality

fix(reader): resolve image loading issue on mobile

docs(api): update authentication endpoints

refactor(caching): improve Redis connection handling
```

### Testing

#### Tests Unitarios

```bash
# Ejecutar tests
npm run test

# Ejecutar con watch mode
npm run test -- --watch

# Ejecutar con UI
npm run test:ui
```

#### Tests E2E

```bash
# Ejecutar Playwright
npm run test:e2e

# Ejecutar con UI
npm run test:e2e:ui
```

#### Cobertura

```bash
npm run test:coverage
```

### Estructura de Archivos

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── [route]/
│   │       └── route.ts
│   ├── (routes)/          # Agrupación de rutas
│   └── page.tsx           # Páginas
├── components/
│   ├── ui/               # Componentes base (shadcn)
│   └── [feature]/        # Componentes por feature
├── hooks/
│   └── use[Name].ts      # Custom hooks
├── lib/
│   └── [util].ts         # Utilidades
└── types/
    └── [name].ts         # Tipos globales
```

### Componentes

#### Componentes UI (shadcn/ui)

```typescript
// src/components/ui/Button.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md',
          variant === 'default' && 'bg-primary text-primary-foreground',
          size === 'sm' && 'h-8 px-3',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
```

#### Componentes de Feature

```typescript
// src/components/Reader/MangaReader.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface MangaReaderProps {
  pages: string[];
  chapterId: string;
}

export function MangaReader({ pages, chapterId }: MangaReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);

  // ...

  return (
    <div className="relative">
      {/* ... */}
    </div>
  );
}
```

### API Routes

```typescript
// src/app/api/manga/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const manga = await prisma.mangaSeries.findUnique({
      where: { id: params.id },
    });

    if (!manga) {
      return NextResponse.json(
        { error: 'Manga not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(manga);
  } catch (error) {
    console.error('Error fetching manga:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Database

#### Migraciones

```bash
# Crear migración
npx prisma migrate dev --name add_user_preferences

# Aplicar migraciones
npx prisma migrate deploy

# Reset (cuidado: borra datos)
npx prisma migrate reset
```

#### Seed

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ...
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Proceso de Review

### Checklist del PR

- [ ] Tests pasan (`npm run test`)
- [ ] Build exitoso (`npm run build`)
- [ ] Linting sin errores (`npm run lint`)
- [ ] Documentación actualizada
- [ ] Commits siguen convenciones
- [ ] Descripción clara del PR

### Qué esperamos

- **PRs pequeños**: Más fáciles de review
- **Descripción clara**: Qué cambia y por qué
- **Tests**: Para nuevas funcionalidades
- **Documentación**: Updates si aplica

### Tiempo de respuesta

- **PRs**: 2-3 días hábiles
- **Issues**: 1 semana
- **Discusiones**: Continuo

## Comunidad

### Canales

- **GitHub Discussions**: Preguntas generales
- **Discord**: Chat en tiempo real
- **Twitter**: Anuncios

### Reconocimientos

Los contribuyentes serán reconocidos en:
- README.md
- Releases
- Página de contribuyentes

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)

## Preguntas?

Si tienes dudas:
1. Revisa la documentación existente
2. Busca en issues/discussions
3. Crea un nuevo issue
4. Únete a Discord

¡Gracias por contribuir! 🎉
