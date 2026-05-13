import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/core/services/FollowService', () => ({
  toggleFollow: vi.fn(),
  getFollowers: vi.fn(),
  getFollowing: vi.fn(),
}));

const { ToggleFollowUseCase } = await import('@/application/use-cases/follows/ToggleFollowUseCase');
const { GetFollowersUseCase } = await import('@/application/use-cases/follows/GetFollowersUseCase');
const { GetFollowingUseCase } = await import('@/application/use-cases/follows/GetFollowingUseCase');
const followService = await import('@/core/services/FollowService');

describe('ToggleFollowUseCase', () => {
  let useCase: InstanceType<typeof ToggleFollowUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ToggleFollowUseCase();
  });

  it('debe seguir a un usuario exitosamente', async () => {
    vi.mocked(followService.toggleFollow).mockResolvedValue({
      success: true,
      isFollowing: true,
    });

    const result = await useCase.execute({
      followerId: 'user-1',
      targetId: 'user-2',
      targetType: 'USER',
    });

    expect(result.success).toBe(true);
    expect(result.isFollowing).toBe(true);
    expect(result.message).toBe('Ahora sigues al usuario');
  });

  it('debe dejar de seguir a un usuario', async () => {
    vi.mocked(followService.toggleFollow).mockResolvedValue({
      success: true,
      isFollowing: false,
    });

    const result = await useCase.execute({
      followerId: 'user-1',
      targetId: 'user-2',
      targetType: 'USER',
    });

    expect(result.isFollowing).toBe(false);
    expect(result.message).toBe('Dejaste de seguir al usuario');
  });

  it('debe seguir un manga', async () => {
    vi.mocked(followService.toggleFollow).mockResolvedValue({
      success: true,
      isFollowing: true,
    });

    const result = await useCase.execute({
      followerId: 'user-1',
      targetId: 'manga-1',
      targetType: 'MANGA',
    });

    expect(result.isFollowing).toBe(true);
    expect(result.message).toBe('Ahora sigues el manga');
  });

  it('debe rechazar auto-seguimiento', async () => {
    await expect(useCase.execute({
      followerId: 'user-1',
      targetId: 'user-1',
      targetType: 'USER',
    })).rejects.toThrow('No puedes seguirte a ti mismo');
  });

  it('debe rechazar tipo de destino inválido', async () => {
    await expect(useCase.execute({
      followerId: 'user-1',
      targetId: 'user-2',
      targetType: 'INVALID' as any,
    })).rejects.toThrow('Tipo de destino inválido');
  });

  it('debe rechazar followerId vacío', async () => {
    await expect(useCase.execute({
      followerId: '',
      targetId: 'user-2',
      targetType: 'USER',
    })).rejects.toThrow('ID de seguidor requerido');
  });
});

describe('GetFollowersUseCase', () => {
  let useCase: InstanceType<typeof GetFollowersUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetFollowersUseCase();
  });

  it('debe retornar seguidores paginados', async () => {
    const followers = [
      { id: 'user-2', username: 'follower1', displayName: 'Follower Uno', avatarUrl: null, followedAt: new Date() },
      { id: 'user-3', username: 'follower2', displayName: null, avatarUrl: '/avatar2.jpg', followedAt: new Date() },
    ];

    vi.mocked(followService.getFollowers).mockResolvedValue({
      followers,
      total: 10,
      hasMore: true,
    });

    const result = await useCase.execute({
      targetId: 'user-1',
      targetType: 'USER',
      page: 1,
      limit: 20,
    });

    expect(result.followers).toHaveLength(2);
    expect(result.total).toBe(10);
    expect(result.hasMore).toBe(true);
    expect(followService.getFollowers).toHaveBeenCalledWith({
      followingId: 'user-1',
      followingType: 'USER',
      page: 1,
      limit: 20,
    });
  });

  it('debe rechazar targetId vacío', async () => {
    await expect(useCase.execute({
      targetId: '',
      targetType: 'USER',
    })).rejects.toThrow('ID de destino requerido');
  });

  it('debe rechazar tipo inválido', async () => {
    await expect(useCase.execute({
      targetId: 'user-1',
      targetType: 'INVALID' as any,
    })).rejects.toThrow('Tipo de destino inválido');
  });
});

describe('GetFollowingUseCase', () => {
  let useCase: InstanceType<typeof GetFollowingUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetFollowingUseCase();
  });

  it('debe retornar seguidos paginados', async () => {
    const following = [
      { id: 'author-1', type: 'USER' as const, name: 'Author Uno', avatarUrl: null, followedAt: new Date() },
      { id: 'manga-1', type: 'MANGA' as const, name: 'Manga Uno', avatarUrl: '/cover.jpg', followedAt: new Date() },
    ];

    vi.mocked(followService.getFollowing).mockResolvedValue({
      following,
      total: 5,
      hasMore: false,
    });

    const result = await useCase.execute({
      userId: 'user-1',
      page: 1,
      limit: 20,
    });

    expect(result.following).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(false);
    expect(followService.getFollowing).toHaveBeenCalledWith({
      followerId: 'user-1',
      followingType: undefined,
      page: 1,
      limit: 20,
    });
  });

  it('debe filtrar por tipo de seguido', async () => {
    vi.mocked(followService.getFollowing).mockResolvedValue({
      following: [],
      total: 0,
      hasMore: false,
    });

    await useCase.execute({
      userId: 'user-1',
      followingType: 'MANGA',
    });

    expect(followService.getFollowing).toHaveBeenCalledWith({
      followerId: 'user-1',
      followingType: 'MANGA',
      page: 1,
      limit: 20,
    });
  });

  it('debe rechazar userId vacío', async () => {
    await expect(useCase.execute({
      userId: '',
    })).rejects.toThrow('ID de usuario requerido');
  });
});
