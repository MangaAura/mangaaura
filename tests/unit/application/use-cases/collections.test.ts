import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/core/services/CollectionService', () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  addMangaToCollection: vi.fn(),
  removeMangaFromCollection: vi.fn(),
  getCollections: vi.fn(),
  getCollectionWithItems: vi.fn(),
  toggleLikeCollection: vi.fn(),
}));

const { CreateCollectionUseCase } = await import('@/application/use-cases/collections/CreateCollectionUseCase');
const { UpdateCollectionUseCase } = await import('@/application/use-cases/collections/UpdateCollectionUseCase');
const { DeleteCollectionUseCase } = await import('@/application/use-cases/collections/DeleteCollectionUseCase');
const { AddItemToCollectionUseCase } = await import('@/application/use-cases/collections/AddItemToCollectionUseCase');
const { RemoveItemFromCollectionUseCase } = await import('@/application/use-cases/collections/RemoveItemFromCollectionUseCase');
const { GetCollectionsUseCase } = await import('@/application/use-cases/collections/GetCollectionsUseCase');
const { GetCollectionUseCase } = await import('@/application/use-cases/collections/GetCollectionUseCase');
const { ToggleCollectionLikeUseCase } = await import('@/application/use-cases/collections/ToggleCollectionLikeUseCase');
const collectionService = await import('@/core/services/CollectionService');

const mockCollection = {
  id: 'col-1',
  title: 'Mis Favoritos',
  description: 'Mis mangas favoritos',
  coverUrl: null,
  isPublic: true,
  itemCount: 0,
  createdAt: new Date(),
};

const mockCollectionWithItems = {
  ...mockCollection,
  likesCount: 5,
  isOwner: true,
  user: { id: 'user-1', username: 'testuser', displayName: null, avatarUrl: null },
  items: [
    { id: 'item-1', mangaId: 'manga-1', title: 'Manga Uno', coverUrl: null, slug: 'manga-uno', authorName: 'Author Uno' },
  ],
};

describe('CreateCollectionUseCase', () => {
  let useCase: InstanceType<typeof CreateCollectionUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new CreateCollectionUseCase();
  });

  it('debe crear una colección exitosamente', async () => {
    vi.mocked(collectionService.createCollection).mockResolvedValue({
      success: true,
      collection: mockCollection,
    });

    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Mis Favoritos',
      description: 'Mis mangas favoritos',
    });

    expect(result.id).toBe('col-1');
    expect(result.title).toBe('Mis Favoritos');
    expect(result.isPublic).toBe(true);
  });

  it('debe crear colección privada', async () => {
    vi.mocked(collectionService.createCollection).mockResolvedValue({
      success: true,
      collection: { ...mockCollection, isPublic: false },
    });

    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Privada',
      isPublic: false,
    });

    expect(result.isPublic).toBe(false);
  });

  it('debe rechazar nombre vacío', async () => {
    await expect(useCase.execute({
      userId: 'user-1',
      name: '',
    })).rejects.toThrow('Nombre de colección requerido');
  });

  it('debe rechazar nombre muy largo', async () => {
    await expect(useCase.execute({
      userId: 'user-1',
      name: 'a'.repeat(101),
    })).rejects.toThrow('El nombre no puede exceder 100 caracteres');
  });

  it('debe rechazar userId vacío', async () => {
    await expect(useCase.execute({
      userId: '',
      name: 'Colección',
    })).rejects.toThrow('ID de usuario requerido');
  });
});

describe('UpdateCollectionUseCase', () => {
  let useCase: InstanceType<typeof UpdateCollectionUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new UpdateCollectionUseCase();
  });

  it('debe actualizar colección exitosamente', async () => {
    const updatedCollection = {
      ...mockCollection,
      title: 'Nuevo Nombre',
      description: 'Nueva descripción',
      updatedAt: new Date(),
    };

    vi.mocked(collectionService.updateCollection).mockResolvedValue({
      success: true,
      collection: updatedCollection,
    });

    const result = await useCase.execute({
      collectionId: 'col-1',
      userId: 'user-1',
      name: 'Nuevo Nombre',
      description: 'Nueva descripción',
    });

    expect(result.title).toBe('Nuevo Nombre');
    expect(result.description).toBe('Nueva descripción');
  });

  it('debe rechazar si la colección no pertenece al usuario', async () => {
    vi.mocked(collectionService.updateCollection).mockResolvedValue({
      success: false,
      error: 'Colección no encontrada',
    });

    await expect(useCase.execute({
      collectionId: 'col-1',
      userId: 'other-user',
      name: 'Nuevo Nombre',
    })).rejects.toThrow('Colección no encontrada');
  });

  it('debe rechazar collectionId vacío', async () => {
    await expect(useCase.execute({
      collectionId: '',
      userId: 'user-1',
    })).rejects.toThrow('ID de colección requerido');
  });
});

describe('DeleteCollectionUseCase', () => {
  let useCase: InstanceType<typeof DeleteCollectionUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new DeleteCollectionUseCase();
  });

  it('debe eliminar colección exitosamente', async () => {
    vi.mocked(collectionService.deleteCollection).mockResolvedValue({
      success: true,
    });

    const result = await useCase.execute({
      collectionId: 'col-1',
      userId: 'user-1',
    });

    expect(result.success).toBe(true);
  });

  it('debe rechazar si la colección no pertenece al usuario', async () => {
    vi.mocked(collectionService.deleteCollection).mockResolvedValue({
      success: false,
      error: 'Colección no encontrada',
    });

    await expect(useCase.execute({
      collectionId: 'col-1',
      userId: 'other-user',
    })).rejects.toThrow('Colección no encontrada');
  });
});

describe('AddItemToCollectionUseCase', () => {
  let useCase: InstanceType<typeof AddItemToCollectionUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new AddItemToCollectionUseCase();
  });

  it('debe agregar manga a colección', async () => {
    vi.mocked(collectionService.addMangaToCollection).mockResolvedValue({
      success: true,
    });

    const result = await useCase.execute({
      collectionId: 'col-1',
      userId: 'user-1',
      mangaId: 'manga-1',
    });

    expect(result.success).toBe(true);
  });

  it('debe rechazar si el manga ya existe', async () => {
    vi.mocked(collectionService.addMangaToCollection).mockResolvedValue({
      success: false,
      error: 'El manga ya está en la colección',
    });

    await expect(useCase.execute({
      collectionId: 'col-1',
      userId: 'user-1',
      mangaId: 'manga-1',
    })).rejects.toThrow('El manga ya está en la colección');
  });
});

describe('RemoveItemFromCollectionUseCase', () => {
  let useCase: InstanceType<typeof RemoveItemFromCollectionUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new RemoveItemFromCollectionUseCase();
  });

  it('debe eliminar manga de colección', async () => {
    vi.mocked(collectionService.removeMangaFromCollection).mockResolvedValue({
      success: true,
    });

    const result = await useCase.execute({
      collectionId: 'col-1',
      userId: 'user-1',
      mangaId: 'manga-1',
    });

    expect(result.success).toBe(true);
  });

  it('debe rechazar si la colección no existe', async () => {
    vi.mocked(collectionService.removeMangaFromCollection).mockResolvedValue({
      success: false,
      error: 'Colección no encontrada',
    });

    await expect(useCase.execute({
      collectionId: 'col-invalid',
      userId: 'user-1',
      mangaId: 'manga-1',
    })).rejects.toThrow('Colección no encontrada');
  });
});

describe('GetCollectionsUseCase', () => {
  let useCase: InstanceType<typeof GetCollectionsUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetCollectionsUseCase();
  });

  it('debe retornar colecciones paginadas', async () => {
    const collections = [
      {
        ...mockCollection,
        likesCount: 10,
        user: { id: 'user-1', username: 'testuser', displayName: null, avatarUrl: null },
      },
    ];

    vi.mocked(collectionService.getCollections).mockResolvedValue({
      success: true,
      collections,
      total: 1,
    });

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.collections).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('debe filtrar por usuario', async () => {
    vi.mocked(collectionService.getCollections).mockResolvedValue({
      success: true,
      collections: [],
      total: 0,
    });

    await useCase.execute({ userId: 'user-1' });

    expect(collectionService.getCollections).toHaveBeenCalledWith({
      userId: 'user-1',
      isPublic: undefined,
      page: 1,
      limit: 20,
    });
  });
});

describe('GetCollectionUseCase', () => {
  let useCase: InstanceType<typeof GetCollectionUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetCollectionUseCase();
  });

  it('debe retornar colección con items', async () => {
    vi.mocked(collectionService.getCollectionWithItems).mockResolvedValue({
      success: true,
      collection: mockCollectionWithItems,
    });

    const result = await useCase.execute({
      collectionId: 'col-1',
      userId: 'user-1',
    });

    expect(result.id).toBe('col-1');
    expect(result.items).toHaveLength(1);
    expect(result.isOwner).toBe(true);
  });

  it('debe rechazar collectionId vacío', async () => {
    await expect(useCase.execute({
      collectionId: '',
    })).rejects.toThrow('ID de colección requerido');
  });
});

describe('ToggleCollectionLikeUseCase', () => {
  let useCase: InstanceType<typeof ToggleCollectionLikeUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ToggleCollectionLikeUseCase();
  });

  it('debe dar like a colección', async () => {
    vi.mocked(collectionService.toggleLikeCollection).mockResolvedValue({
      success: true,
      isLiked: true,
    });

    const result = await useCase.execute({
      collectionId: 'col-1',
      userId: 'user-1',
    });

    expect(result.success).toBe(true);
    expect(result.isLiked).toBe(true);
  });

  it('debe quitar like de colección', async () => {
    vi.mocked(collectionService.toggleLikeCollection).mockResolvedValue({
      success: true,
      isLiked: false,
    });

    const result = await useCase.execute({
      collectionId: 'col-1',
      userId: 'user-1',
      isLiked: true,
    });

    expect(result.isLiked).toBe(false);
  });

  it('debe rechazar collectionId vacío', async () => {
    await expect(useCase.execute({
      collectionId: '',
      userId: 'user-1',
    })).rejects.toThrow('ID de colección requerido');
  });

  it('debe rechazar userId vacío', async () => {
    await expect(useCase.execute({
      collectionId: 'col-1',
      userId: '',
    })).rejects.toThrow('ID de usuario requerido');
  });
});
