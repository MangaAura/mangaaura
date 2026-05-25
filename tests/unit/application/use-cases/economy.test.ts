import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockPaymentService = {
  sendTip: vi.fn(),
  contributeToCrowdfunding: vi.fn(),
  getUserBalance: vi.fn(),
  getUserTipStats: vi.fn(),
  getUserCrowdfundingStats: vi.fn(),
};

const mockUserRepo = {
  findById: vi.fn(),
};

const mockTransactionRepo = {
  findByUserId: vi.fn(),
  countByUserId: vi.fn(),
  getBalance: vi.fn(),
};

const { SendTipUseCase } = await import('@/application/use-cases/economy/SendTipUseCase');
const { ContributeCrowdfundingUseCase } = await import('@/application/use-cases/economy/ContributeCrowdfundingUseCase');
const { GetBalanceUseCase } = await import('@/application/use-cases/economy/GetBalanceUseCase');
const { ListTransactionsUseCase } = await import('@/application/use-cases/economy/ListTransactionsUseCase');

describe('SendTipUseCase', () => {
  let useCase: InstanceType<typeof SendTipUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new SendTipUseCase(mockPaymentService as any);
  });

  it('debe enviar un tip exitosamente', async () => {
    mockPaymentService.sendTip.mockResolvedValue({
      success: true,
      newBalance: 900,
      tip: {
        id: 'tip-1',
        amount: 100,
        chapterId: 'chapter-1',
        fromUserId: 'user-1',
        toUserId: 'author-1',
        message: null,
        createdAt: new Date('2025-01-01'),
      },
    });

    const result = await useCase.execute({
      senderId: 'user-1',
      chapterId: 'chapter-1',
      amount: 100,
    });

    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(900);
    expect(result.tip.amount).toBe(100);
  });

  it('debe rechazar monto inválido', async () => {
    await expect(useCase.execute({
      senderId: 'user-1',
      chapterId: 'chapter-1',
      amount: 0,
    })).rejects.toThrow('El monto mínimo es 1 Aura');
  });

  it('debe rechazar monto que excede el límite', async () => {
    await expect(useCase.execute({
      senderId: 'user-1',
      chapterId: 'chapter-1',
      amount: 1001,
    })).rejects.toThrow('El monto no puede exceder 1000 Auras');
  });

  it('debe rechazar senderId vacío', async () => {
    await expect(useCase.execute({
      senderId: '',
      chapterId: 'chapter-1',
      amount: 50,
    })).rejects.toThrow('ID del remitente requerido');
  });

  it('debe rechazar chapterId vacío', async () => {
    await expect(useCase.execute({
      senderId: 'user-1',
      chapterId: '',
      amount: 50,
    })).rejects.toThrow('ID del capítulo requerido');
  });
});

describe('ContributeCrowdfundingUseCase', () => {
  let useCase: InstanceType<typeof ContributeCrowdfundingUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ContributeCrowdfundingUseCase(mockPaymentService as any);
  });

  it('debe contribuir exitosamente', async () => {
    mockPaymentService.contributeToCrowdfunding.mockResolvedValue({
      success: true,
      newTotal: 2500,
      goalReached: false,
      contribution: {
        id: 'contrib-1',
        chapterId: 'chapter-1',
        userId: 'user-1',
        amount: 500,
        isAnonymous: false,
        message: null,
        createdAt: new Date('2025-01-01'),
      },
    });

    const result = await useCase.execute({
      userId: 'user-1',
      chapterId: 'chapter-1',
      amount: 500,
    });

    expect(result.success).toBe(true);
    expect(result.newTotal).toBe(2500);
    expect(result.goalReached).toBe(false);
  });

  it('debe reportar goal alcanzado', async () => {
    mockPaymentService.contributeToCrowdfunding.mockResolvedValue({
      success: true,
      newTotal: 10000,
      goalReached: true,
      contribution: {
        id: 'contrib-2',
        chapterId: 'chapter-1',
        userId: 'user-1',
        amount: 1000,
        isAnonymous: true,
        message: '¡Apoyo total!',
        createdAt: new Date('2025-01-01'),
      },
    });

    const result = await useCase.execute({
      userId: 'user-1',
      chapterId: 'chapter-1',
      amount: 1000,
      isAnonymous: true,
      message: '¡Apoyo total!',
    });

    expect(result.goalReached).toBe(true);
  });

  it('debe rechazar contribución con saldo insuficiente', async () => {
    mockPaymentService.contributeToCrowdfunding.mockRejectedValue(new Error('Saldo insuficiente'));

    await expect(useCase.execute({
      userId: 'user-1',
      chapterId: 'chapter-1',
      amount: 99999,
    })).rejects.toThrow('Saldo insuficiente');
  });

  it('debe rechazar monto inválido', async () => {
    await expect(useCase.execute({
      userId: 'user-1',
      chapterId: 'chapter-1',
      amount: 0,
    })).rejects.toThrow('El monto mínimo es 1 Aura');
  });
});

describe('GetBalanceUseCase', () => {
  let useCase: InstanceType<typeof GetBalanceUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new GetBalanceUseCase(mockUserRepo as any, mockPaymentService as any);
  });

  it('debe retornar el balance correctamente', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 'user-1',
      xp: { amount: 1500, level: 3, rank: 'Otaku Experto', progressToNextLevel: 0.5 },
    });
    mockPaymentService.getUserBalance.mockResolvedValue(500);
    mockPaymentService.getUserTipStats.mockResolvedValue({
      totalGiven: 200,
      totalReceived: 100,
      countGiven: 2,
      countReceived: 1,
    });
    mockPaymentService.getUserCrowdfundingStats.mockResolvedValue({
      totalRaised: 3000,
      totalContributors: 10,
      activeCampaigns: 2,
      completedCampaigns: 1,
    });

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.aura).toBe(500);
    expect(result.xp).toBe(1500);
    expect(result.level).toBe(3);
    expect(result.stats.tips.totalGiven).toBe(200);
    expect(result.stats.crowdfunding.totalRaised).toBe(3000);
  });

  it('debe lanzar error si usuario no existe', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'user-notfound' }))
      .rejects.toThrow('Usuario no encontrado');
  });

  it('debe rechazar userId vacío', async () => {
    await expect(useCase.execute({ userId: '' }))
      .rejects.toThrow('ID de usuario requerido');
  });
});

describe('ListTransactionsUseCase', () => {
  let useCase: InstanceType<typeof ListTransactionsUseCase>;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ListTransactionsUseCase(mockTransactionRepo as any);
  });

  it('debe retornar transacciones paginadas', async () => {
    const transactions = [
      { id: 'tx-1', amount: -50, type: 'TIP_SENT', description: 'Propina', referenceId: 'tip-1', timestamp: new Date() },
      { id: 'tx-2', amount: 100, type: 'TIP_RECEIVED', description: 'Propina recibida', referenceId: 'tip-2', timestamp: new Date() },
    ];

    mockTransactionRepo.findByUserId.mockResolvedValue(transactions);
    mockTransactionRepo.countByUserId.mockResolvedValue(10);
    mockTransactionRepo.getBalance.mockResolvedValue(500);

    const result = await useCase.execute({ userId: 'user-1', page: 1, limit: 20 });

    expect(result.transactions).toHaveLength(2);
    expect(result.balance).toBe(500);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.totalPages).toBe(1);
    expect(mockTransactionRepo.findByUserId).toHaveBeenCalledWith('user-1', { skip: 0, take: 20, type: undefined });
  });

  it('debe filtrar por tipo de transacción', async () => {
    mockTransactionRepo.findByUserId.mockResolvedValue([]);
    mockTransactionRepo.countByUserId.mockResolvedValue(0);
    mockTransactionRepo.getBalance.mockResolvedValue(100);

    await useCase.execute({ userId: 'user-1', type: 'TIP_SENT' });

    expect(mockTransactionRepo.findByUserId).toHaveBeenCalledWith('user-1', {
      skip: 0,
      take: 20,
      type: 'TIP_SENT',
    });
  });

  it('debe rechazar userId vacío', async () => {
    await expect(useCase.execute({ userId: '' }))
      .rejects.toThrow('ID de usuario requerido');
  });

  it('debe aplicar límite máximo de 100', async () => {
    mockTransactionRepo.findByUserId.mockResolvedValue([]);
    mockTransactionRepo.countByUserId.mockResolvedValue(0);
    mockTransactionRepo.getBalance.mockResolvedValue(0);

    const result = await useCase.execute({ userId: 'user-1', limit: 999 });

    expect(result.pagination.limit).toBe(100);
  });
});
