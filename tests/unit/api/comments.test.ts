import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.hoisted(() => vi.fn());
const mockRateLimit = vi.hoisted(() => vi.fn());
const mockModerateComment = vi.hoisted(() => vi.fn());
const mockQuickFilterSpam = vi.hoisted(() => vi.fn().mockReturnValue(false));
const mockPostCommentExecute = vi.hoisted(() => vi.fn());
const mockFindUnique = vi.hoisted(() => vi.fn());
const mockFindManyUsers = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mockRateLimit,
  getRateLimitKey: vi.fn(() => 'ratelimit:comments:test'),
}));
vi.mock('@/services/ModerationService', () => ({
  moderateComment: mockModerateComment,
  quickFilterSpam: mockQuickFilterSpam,
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    chapter: { findUnique: mockFindUnique },
    user: { findMany: mockFindManyUsers },
  },
}));
vi.mock('@/lib/mongoose', () => ({ default: vi.fn() }));
vi.mock('@/infrastructure/adapters/CommentRepositoryAdapter', () => ({ CommentRepositoryAdapter: vi.fn() }));
vi.mock('@/infrastructure/adapters/UserXPRepositoryAdapter', () => ({ UserXPRepositoryAdapter: vi.fn() }));
vi.mock('@/infrastructure/adapters/EventBusAdapter', () => ({ EventBusAdapter: vi.fn() }));
vi.mock('@/infrastructure/adapters/AchievementServiceAdapter', () => ({ AchievementServiceAdapter: vi.fn() }));
vi.mock('@/application/use-cases/PostCommentUseCase', () => ({
  PostCommentUseCase: vi.fn().mockImplementation(function () {
    return { execute: mockPostCommentExecute };
  }),
}));
vi.mock('@/infrastructure/persistence/mongodb/models/Comment', () => ({
  CommentModel: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

import { GET, POST } from '@/app/api/comments/route';
import { CommentModel } from '@/infrastructure/persistence/mongodb/models/Comment';

const UUID = '123e4567-e89b-12d3-a456-426614174000';
const mockSession = { user: { id: 'user-1', role: 'USER' } };

function createRequest(url: string, body?: unknown): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: body ? 'POST' : 'GET',
  });
  if (body) {
    (req as any).json = () => Promise.resolve(JSON.parse(JSON.stringify(body)));
  }
  return req;
}

describe('POST /api/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    mockFindUnique.mockResolvedValue({ id: UUID, mangaId: 'manga-1' });
    mockModerateComment.mockResolvedValue({
      toxicity: 10,
      spoilerScore: 0,
      sentiment: 'neutral',
      categories: [],
      requiresReview: false,
      isHidden: false,
      reason: '',
    });
    mockPostCommentExecute.mockResolvedValue({
      id: 'comment-1',
      chapterId: UUID,
      userId: 'user-1',
      content: 'Great chapter!',
      aiAnalysis: { toxicity: 10, spoilerScore: 0, sentiment: 'neutral' },
      isHidden: false,
      createdAt: new Date().toISOString(),
      xpGained: 5,
    });
  });

  it('creates a comment successfully', async () => {
    const response = await POST(
      createRequest('/api/comments', { chapterId: UUID, content: 'Great chapter!' })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.comment.content).toBe('Great chapter!');
    expect(data.xpEarned).toBe(5);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(
      createRequest('/api/comments', { chapterId: UUID, content: 'test' })
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No autorizado');
  });

  it('returns 400 for invalid input data', async () => {
    const response = await POST(
      createRequest('/api/comments', { chapterId: 'not-a-uuid', content: '' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Datos inválidos');
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });

    const response = await POST(
      createRequest('/api/comments', { chapterId: UUID, content: 'test' })
    );

    expect(response.status).toBe(429);
  });

  it('returns 404 when chapter not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const response = await POST(
      createRequest('/api/comments', { chapterId: '00000000-0000-0000-0000-000000000000', content: 'test' })
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Capítulo no encontrado');
  });

  it('returns 400 for spam content', async () => {
    mockQuickFilterSpam.mockReturnValueOnce(true);

    const response = await POST(
      createRequest('/api/comments', { chapterId: UUID, content: 'buy now!!!' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Contenido bloqueado por spam');
  });

  it('returns 400 for toxic content', async () => {
    mockModerateComment.mockResolvedValue({
      toxicity: 95,
      spoilerScore: 0,
      sentiment: 'negative',
      categories: ['harassment'],
      reason: 'Lenguaje ofensivo',
      requiresReview: false,
      isHidden: true,
    });

    const response = await POST(
      createRequest('/api/comments', { chapterId: UUID, content: 'offensive content' })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Contenido bloqueado por toxicidad');
  });

  it('returns 500 on internal error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB error'));

    const response = await POST(
      createRequest('/api/comments', { chapterId: UUID, content: 'test' })
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Error interno del servidor');
  });
});

describe('GET /api/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });
    mockFindManyUsers.mockResolvedValue([{ id: 'user-1', username: 'testuser', avatarUrl: null, level: 5 }]);
    (CommentModel.find as any).mockReturnValue({
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: { toString: () => 'comment-1' },
          chapterId: 'chapter-1',
          userId: 'user-1',
          content: 'Great chapter!',
          aiAnalysis: null,
          isHidden: false,
          likes: 0,
          replies: 0,
          createdAt: new Date(),
        },
      ]),
    });
    (CommentModel.countDocuments as any).mockResolvedValue(1);
  });

  it('returns comments for a chapter', async () => {
    const response = await GET(createRequest('/api/comments?chapterId=chapter-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].content).toBe('Great chapter!');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest('/api/comments?chapterId=chapter-1'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No autorizado');
  });

  it('returns 400 when chapterId is missing', async () => {
    const response = await GET(createRequest('/api/comments'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('chapterId es requerido');
  });

  it('returns pagination metadata', async () => {
    const response = await GET(createRequest('/api/comments?chapterId=chapter-1'));
    const data = await response.json();

    expect(data.pagination).toHaveProperty('page');
    expect(data.pagination).toHaveProperty('total');
    expect(data.pagination).toHaveProperty('totalPages');
  });

  it('includes user data in enriched comments', async () => {
    const response = await GET(createRequest('/api/comments?chapterId=chapter-1'));
    const data = await response.json();

    expect(data.comments[0].user).toBeDefined();
    expect(data.comments[0].user.id).toBe('user-1');
    expect(data.comments[0].user.username).toBe('testuser');
  });
});
