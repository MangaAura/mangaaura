import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockQueryRepo = {
  getUserNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
};

const mockWriteRepo = {
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  getUnreadCount: vi.fn(),
  findById: vi.fn(),
};

const mockDeleteRepo = {
  findById: vi.fn(),
  deleteNotification: vi.fn(),
};

const mockStatsRepo = {
  getUnreadCount: vi.fn(),
  getNotificationStats: vi.fn(),
};

const { GetNotificationsUseCase } = await import('@/application/use-cases/notifications/GetNotificationsUseCase');
const { MarkNotificationReadUseCase } = await import('@/application/use-cases/notifications/MarkNotificationReadUseCase');
const { DeleteNotificationUseCase } = await import('@/application/use-cases/notifications/DeleteNotificationUseCase');
const { GetUnreadCountUseCase } = await import('@/application/use-cases/notifications/GetUnreadCountUseCase');

describe('GetNotificationsUseCase', () => {
  let useCase: InstanceType<typeof GetNotificationsUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetNotificationsUseCase(mockQueryRepo as any);
  });

  it('debe retornar notificaciones sin filtros', async () => {
    const notifications = [
      { id: 'notif-1', userId: 'user-1', type: 'NEW_CHAPTER', title: 'Nuevo capítulo', message: 'Nuevo capítulo disponible', isRead: false, createdAt: new Date(), data: null, imageUrl: null, linkUrl: null },
      { id: 'notif-2', userId: 'user-1', type: 'TIP_RECEIVED', title: 'Propina recibida', message: 'Recibiste una propina', isRead: true, createdAt: new Date(), data: null, imageUrl: null, linkUrl: null },
    ];

    mockQueryRepo.getUserNotifications.mockResolvedValue(notifications);
    mockQueryRepo.getUnreadCount.mockResolvedValue(1);

    const result = await useCase.execute({ userId: 'user-1', limit: 20, offset: 0 });

    expect(result.notifications).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.unreadCount).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('debe filtrar por tipo', async () => {
    const notifications = [
      { id: 'notif-1', userId: 'user-1', type: 'NEW_CHAPTER', title: 'Nuevo capítulo', message: 'test', isRead: false, createdAt: new Date(), data: null, imageUrl: null, linkUrl: null },
      { id: 'notif-2', userId: 'user-1', type: 'TIP_RECEIVED', title: 'Propina', message: 'test', isRead: true, createdAt: new Date(), data: null, imageUrl: null, linkUrl: null },
    ];

    mockQueryRepo.getUserNotifications.mockResolvedValue(notifications);
    mockQueryRepo.getUnreadCount.mockResolvedValue(1);

    const result = await useCase.execute({ userId: 'user-1', type: 'NEW_CHAPTER' });

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].type).toBe('NEW_CHAPTER');
  });

  it('debe filtrar solo no leídas', async () => {
    const notifications = [
      { id: 'notif-1', userId: 'user-1', type: 'NEW_CHAPTER', title: 'Nuevo capítulo', message: 'test', isRead: false, createdAt: new Date(), data: null, imageUrl: null, linkUrl: null },
      { id: 'notif-2', userId: 'user-1', type: 'TIP_RECEIVED', title: 'Propina', message: 'test', isRead: true, createdAt: new Date(), data: null, imageUrl: null, linkUrl: null },
    ];

    mockQueryRepo.getUserNotifications.mockResolvedValue(notifications);
    mockQueryRepo.getUnreadCount.mockResolvedValue(1);

    const result = await useCase.execute({ userId: 'user-1', includeRead: false });

    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].isRead).toBe(false);
  });

  it('debe rechazar userId vacío', async () => {
    await expect(useCase.execute({ userId: '' }))
      .rejects.toThrow('ID de usuario requerido');
  });
});

describe('MarkNotificationReadUseCase', () => {
  let useCase: InstanceType<typeof MarkNotificationReadUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new MarkNotificationReadUseCase(mockWriteRepo as any);
  });

  it('debe marcar notificación como leída', async () => {
    mockWriteRepo.findById.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-1',
      isRead: false,
    });
    mockWriteRepo.markAsRead.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-1',
      isRead: true,
    });
    mockWriteRepo.getUnreadCount.mockResolvedValue(3);

    const result = await useCase.execute({ userId: 'user-1', notificationId: 'notif-1' });

    expect(result.success).toBe(true);
    expect(result.notificationId).toBe('notif-1');
    expect(result.unreadCount).toBe(3);
  });

  it('debe rechazar si la notificación no existe', async () => {
    mockWriteRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'user-1', notificationId: 'notif-invalid' }))
      .rejects.toThrow('Notificación no encontrada');
  });

  it('debe rechazar si el usuario no es el dueño', async () => {
    mockWriteRepo.findById.mockResolvedValue({
      id: 'notif-1',
      userId: 'other-user',
    });

    await expect(useCase.execute({ userId: 'user-1', notificationId: 'notif-1' }))
      .rejects.toThrow('No autorizado para modificar esta notificación');
  });

  it('debe marcar todas como leídas', async () => {
    mockWriteRepo.markAllAsRead.mockResolvedValue(5);

    const result = await useCase.executeMarkAll({ userId: 'user-1' });

    expect(result.success).toBe(true);
    expect(result.markedCount).toBe(5);
    expect(result.unreadCount).toBe(0);
  });
});

describe('DeleteNotificationUseCase', () => {
  let useCase: InstanceType<typeof DeleteNotificationUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new DeleteNotificationUseCase(mockDeleteRepo as any);
  });

  it('debe eliminar notificación exitosamente', async () => {
    mockDeleteRepo.findById.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-1',
    });
    mockDeleteRepo.deleteNotification.mockResolvedValue(true);

    const result = await useCase.execute({ userId: 'user-1', notificationId: 'notif-1' });

    expect(result.success).toBe(true);
    expect(result.notificationId).toBe('notif-1');
  });

  it('debe rechazar si la notificación no existe', async () => {
    mockDeleteRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'user-1', notificationId: 'notif-invalid' }))
      .rejects.toThrow('Notificación no encontrada');
  });

  it('debe rechazar si el usuario no es el dueño', async () => {
    mockDeleteRepo.findById.mockResolvedValue({
      id: 'notif-1',
      userId: 'other-user',
    });

    await expect(useCase.execute({ userId: 'user-1', notificationId: 'notif-1' }))
      .rejects.toThrow('No autorizado para eliminar esta notificación');
  });
});

describe('GetUnreadCountUseCase', () => {
  let useCase: InstanceType<typeof GetUnreadCountUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetUnreadCountUseCase(mockStatsRepo as any);
  });

  it('debe retornar conteo de no leídas', async () => {
    mockStatsRepo.getNotificationStats.mockResolvedValue({
      total: 10,
      unread: 3,
      byType: { NEW_CHAPTER: 2, TIP_RECEIVED: 1 },
    });

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.unread).toBe(3);
    expect(result.total).toBe(10);
    expect(result.byType.NEW_CHAPTER).toBe(2);
  });

  it('debe rechazar userId vacío', async () => {
    await expect(useCase.execute({ userId: '' }))
      .rejects.toThrow('ID de usuario requerido');
  });
});
