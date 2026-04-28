# ADR 001: Arquitectura Hexagonal (Clean Architecture)

## Estado
Aceptado

## Contexto
Necesitamos una arquitectura que:
1. Permita cambiar fácilmente entre tecnologías (DB, AI, Auth)
2. Sea testeable sin dependencias externas
3. Escale sin romper el código existente
4. Sea comprensible para nuevos desarrolladores

## Decisión
Adoptamos **Arquitectura Hexagonal** (Ports & Adapters) con **Domain-Driven Design**.

## Estructura
```
src/
├── core/              # ← Domain Layer (puro, sin deps externas)
│   ├── entities/      # User, Manga, etc.
│   ├── value-objects/ # Email, Password, XP, Money
│   ├── repositories/  # Interfaces (ports)
│   ├── services/      # Interfaces de servicios externos
│   └── events/        # Sistema de eventos del dominio
│
├── application/       # ← Application Layer
│   ├── use-cases/     # Casos de uso (orquestación)
│   └── dto/           # Data Transfer Objects
│
├── infrastructure/    # ← Infrastructure Layer (adapters)
│   ├── persistence/     # PostgreSQL (Prisma) + MongoDB
│   ├── ai/              # NVIDIA Provider
│   ├── auth/            # NextAuth.js
│   └── queue/           # BullMQ / Local EventBus
│
└── app/               # ← Presentation Layer (Next.js)
    ├── api/             # API Routes
    └── ...              # Pages & Components
```

## Reglas
1. **Dependencia Invertida**: Core no depende de infraestructura
2. **Interfaces en Core**: Repositories y servicios son interfaces
3. **Implementaciones en Infra**: PostgreSQL, NVIDIA, etc.
4. **Eventos para desacoplar**: Comunicación entre capas

## Consecuencias

### Positivas
- ✅ Cambiar de PostgreSQL a MongoDB = 1 archivo
- ✅ Cambiar de NVIDIA a OpenAI = 1 archivo
- ✅ Testing unitario sin mocks complejos
- ✅ Código organizado por responsabilidad

### Negativas
- ❌ Más carpetas/boilerplate inicial
- ❌ Curva de aprendizaje para nuevos devs
- ❌ Más código para casos simples

## Alternativas Consideradas

### 1. MVC tradicional
- ❌ Mezcla de lógica y presentación
- ❌ Difícil de testear
- ❌ Acoplado a frameworks

### 2. Feature-Based
- ⚠️ Mejor que MVC, pero sin separación de dominio
- ⚠️ Puede crecer desorganizado

### 3. Serverless Functions
- ❌ Vendor lock-in
- ❌ Difícil de testear local

## Ejemplo
```typescript
// Core: Interfaz (Port)
interface UserRepository {
  findById(id: string): Promise<User | null>;
}

// Infrastructure: Implementación (Adapter)
class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const dbUser = await prisma.user.findUnique({ where: { id } });
    return dbUser ? this.mapToDomain(dbUser) : null;
  }
}

// Application: Caso de uso
class GetUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new UserNotFoundError(id);
    return user;
  }
}
```

## Relacionado
- ADR 002: Dual Database Strategy
- ADR 003: Event-Driven Architecture

## Fecha
2024-01-20

## Autores
- @migue (Lead Developer)
