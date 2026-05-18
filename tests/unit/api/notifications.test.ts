import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAuth = vi.hoisted(() => vi.fn());
const mockGetNotificationsExecute = vi.hoisted(() => vi.fn());
const mockCreateNotification = vi.hoisted(() => vi.fn());
const mockGetNotificationService = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth', () => ({ auth: mockAuth }));
vi.mock('@/core/services/NotificationService', () => ({
  getNotificationService: mockGetNotificationService,
}));
vi.mock('@/application/use-cases/notifications/GetNotificationsUseCase', () => ({
  GetNotificationsUseCase: vi.fn().mockImplementation(function () {
    return { execute: mockGetNotificationsExecute };
  }),
}));

import { GET, POST } from '@/app/api/notifications/route';

const mockSession = { user: { id: 'user-1' } };
const adminSession = { user: { id: 'admin-1', role: 'ADMIN' } };

function createRequest(url: string, body?: unknown): NextRequest {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: body ? 'POST' : 'GET',
  });
  if (body) {
    (req as any).json = () => Promise.resolve(JSON.parse(JSON.stringify(body)));
  }
  return req;
}

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
    mockGetNotificationsExecute.mockResolvedValue({
      notifications: [
        {
          id: 'notif-1',
          type: 'NEW_CHAPTER',
          title: 'Nuevo capítulo',
          message: 'Nuevo capítulo de Tu Manga',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      unreadCount: 1,
      hasMore: false,
    });
  });

  it('returns notifications for authenticated user', async () => {
    const response = await GET(createRequest('/api/notifications'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notifications).toHaveLength(1);
    expect(data.notifications[0].type).toBe('NEW_CHAPTER');
    expect(data.unreadCount).toBe(1);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest('/api/notifications'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('passes type filter when provided', async () => {
    await GET(createRequest('/api/notifications?type=NEW_CHAPTER'));

    expect(mockGetNotificationsExecute).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'NEW_CHAPTER' })
    );
  });

  it('passes limit parameter', async () => {
    await GET(createRequest('/api/notifications?limit=5'));

    expect(mockGetNotificationsExecute).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5 })
    );
  });

  it('clamps limit between 1 and 100', async () => {
    await GET(createRequest('/api/notifications?limit=200'));

    expect(mockGetNotificationsExecute).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 })
    );
  });

  it('passes includeRead parameter', async () => {
    await GET(createRequest('/api/notifications?includeRead=false'));

    expect(mockGetNotificationsExecute).toHaveBeenCalledWith(
      expect.objectContaining({ includeRead: false })
    );
  });

  it('returns 500 on internal error', async () => {
    mockGetNotificationsExecute.mockRejectedValue(new Error('Service error'));

    const response = await GET(createRequest('/api/notifications'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch notifications');
  });
});

describe('POST /api/notifications', () => {
  const validBody = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    type: 'SYSTEM' as const,
    title: 'Test notification',
    message: 'This is a test notification',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(adminSession);
    mockGetNotificationService.mockResolvedValue({ createNotification: mockCreateNotification });
    mockCreateNotification.mockResolvedValue({ id: 'notif-new', ...validBody, isRead: false, createdAt: new Date() });
  });

  it('creates a notification as admin', async () => {
    const response = await POST(createRequest('/api/notifications', validBody));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.notification.id).toBe('notif-new');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(createRequest('/api/notifications', validBody));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 403 when not admin', async () => {
    mockAuth.mockResolvedValue(mockSession);

    const response = await POST(createRequest('/api/notifications', validBody));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden - Admin only');
  });

  it('returns 400 for invalid body', async () => {
    const response = await POST(createRequest('/api/notifications', {}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid data');
  });
});
