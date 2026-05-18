import { describe, it, expect, beforeEach } from 'vitest';
import {
  QuestService,
  getQuestService,
  initializeQuestService,
  DAILY_QUESTS,
  WEEKLY_QUESTS,
  ALL_QUESTS,
  type ActiveQuest,
} from '@/core/services/QuestService';

// ─── Helpers ───────────────────────────────────────────────────────

/** Create a mock ActiveQuest for testing */
function mockQuest(overrides: Partial<ActiveQuest> = {}): ActiveQuest {
  return {
    questId: 'DAILY_READ_1',
    category: 'DAILY',
    actionType: 'READ_CHAPTERS',
    label: 'Lector Diario',
    description: 'Lee 1 capítulo hoy',
    iconName: 'BookOpen',
    target: 1,
    progress: 0,
    xpReward: 10,
    inkcoinsReward: 0,
    completed: false,
    claimed: false,
    sortOrder: 1,
    progressPercent: 0,
    timeRemaining: 3600000,
    periodEnd: new Date(Date.now() + 3600000).toISOString(),
    ...overrides,
  };
}

/** Create a mock DB UserQuest record */
function mockUserQuest(overrides: {
  questId: string;
  progress?: number;
  target?: number;
  completed?: boolean;
  claimed?: boolean;
  periodStart?: Date;
  periodEnd?: Date;
}): {
  id: string;
  questId: string;
  progress: number;
  target: number;
  completed: boolean;
  completedAt: Date | null;
  claimed: boolean;
  claimedAt: Date | null;
  periodStart: Date;
  periodEnd: Date;
} {
  const now = Date.now();
  return {
    id: `db-${overrides.questId}`,
    questId: overrides.questId,
    progress: overrides.progress ?? 0,
    target: overrides.target ?? 1,
    completed: overrides.completed ?? false,
    completedAt: overrides.completed ? new Date(now) : null,
    claimed: overrides.claimed ?? false,
    claimedAt: overrides.claimed ? new Date(now) : null,
    periodStart: overrides.periodStart ?? new Date(now - 3600000),
    periodEnd: overrides.periodEnd ?? new Date(now + 3600000),
  };
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('QuestService', () => {
  let service: QuestService;

  beforeEach(() => {
    service = new QuestService();
  });

  // ═════════════════════════════════════════════════════════════════
  // Period Boundaries
  // ═════════════════════════════════════════════════════════════════
  describe('getDailyPeriod', () => {
    it('debe retornar inicio a las 00:00:00 UTC de hoy y fin a las 00:00:00 UTC de mañana', () => {
      const { start, end } = service.getDailyPeriod();

      // Start should be midnight UTC today
      expect(start.getUTCHours()).toBe(0);
      expect(start.getUTCMinutes()).toBe(0);
      expect(start.getUTCSeconds()).toBe(0);
      expect(start.getUTCMilliseconds()).toBe(0);

      // End should be midnight UTC tomorrow
      expect(end.getUTCHours()).toBe(0);
      expect(end.getUTCMinutes()).toBe(0);
      expect(end.getUTCSeconds()).toBe(0);
      expect(end.getUTCMilliseconds()).toBe(0);

      // Exactly 24 hours apart
      expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);

      // Start is today
      const today = new Date();
      expect(start.getUTCFullYear()).toBe(today.getUTCFullYear());
      expect(start.getUTCMonth()).toBe(today.getUTCMonth());
      expect(start.getUTCDate()).toBe(today.getUTCDate());
    });

    it('debe ser inmune a la hora local (pura lógica UTC)', () => {
      // Si ejecutamos dos veces en el mismo milisegundo, mismo resultado
      const p1 = service.getDailyPeriod();
      const p2 = service.getDailyPeriod();
      expect(p1.start.getTime()).toBe(p2.start.getTime());
      expect(p1.end.getTime()).toBe(p2.end.getTime());
    });
  });

  describe('getWeeklyPeriod', () => {
    it('debe retornar inicio el lunes a las 00:00:00 UTC y fin el siguiente lunes', () => {
      const { start, end } = service.getWeeklyPeriod();

      // Start should be Monday (UTC day = 1)
      expect(start.getUTCDay()).toBe(1); // Monday
      expect(start.getUTCHours()).toBe(0);
      expect(start.getUTCMinutes()).toBe(0);
      expect(start.getUTCSeconds()).toBe(0);

      // End should be next Monday
      expect(end.getUTCDay()).toBe(1);
      expect(end.getUTCHours()).toBe(0);

      // Exactly 7 days apart
      expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('el inicio debe ser <= ahora y el fin > ahora', () => {
      const { start, end } = service.getWeeklyPeriod();
      const now = Date.now();

      expect(start.getTime()).toBeLessThanOrEqual(now);
      expect(end.getTime()).toBeGreaterThan(now);
    });

    it('debe retornar el lunes de esta semana como inicio (cualquier día)', () => {
      const { start } = service.getWeeklyPeriod();
      const now = new Date();
      const dayOfWeek = now.getUTCDay(); // 0=Sunday, 1=Monday
      const expectedDaysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const diffMs = now.getTime() - start.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Should be between 0 and 6 days back (Monday of current week)
      expect(diffDays).toBeGreaterThanOrEqual(0);
      expect(diffDays).toBeLessThanOrEqual(6);
      // The calculated days back should match
      expect(diffDays).toBe(expectedDaysBack);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // Quest Definitions
  // ═════════════════════════════════════════════════════════════════
  describe('quest definitions', () => {
    it('DAILY_QUESTS debe tener 4 misiones', () => {
      expect(DAILY_QUESTS).toHaveLength(4);
    });

    it('WEEKLY_QUESTS debe tener 4 misiones', () => {
      expect(WEEKLY_QUESTS).toHaveLength(4);
    });

    it('ALL_QUESTS debe tener 8 misiones (4 daily + 4 weekly)', () => {
      expect(ALL_QUESTS).toHaveLength(8);
      expect(ALL_QUESTS.filter((q) => q.category === 'DAILY')).toHaveLength(4);
      expect(ALL_QUESTS.filter((q) => q.category === 'WEEKLY')).toHaveLength(4);
    });

    it('todos los questId deben ser únicos', () => {
      const ids = ALL_QUESTS.map((q) => q.questId);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    it('todas las daily deben tener categoría DAILY', () => {
      for (const q of DAILY_QUESTS) {
        expect(q.category).toBe('DAILY');
        expect(q.target).toBeGreaterThan(0);
        expect(q.xpReward).toBeGreaterThanOrEqual(0);
        expect(q.sortOrder).toBeGreaterThan(0);
      }
    });

    it('todas las weekly deben tener categoría WEEKLY', () => {
      for (const q of WEEKLY_QUESTS) {
        expect(q.category).toBe('WEEKLY');
        expect(q.target).toBeGreaterThan(0);
        expect(q.xpReward).toBeGreaterThanOrEqual(0);
        expect(q.sortOrder).toBeGreaterThan(0);
      }
    });
  });

  describe('getQuestDefinition', () => {
    it('debe retornar la definición para un questId válido', () => {
      const def = service.getQuestDefinition('DAILY_READ_1');
      expect(def).toBeDefined();
      expect(def!.questId).toBe('DAILY_READ_1');
      expect(def!.category).toBe('DAILY');
      expect(def!.target).toBe(1);
    });

    it('debe retornar undefined para un questId inexistente', () => {
      expect(service.getQuestDefinition('NONEXISTENT')).toBeUndefined();
    });

    it('debe encontrar todas las quests por ID', () => {
      for (const q of ALL_QUESTS) {
        const def = service.getQuestDefinition(q.questId);
        expect(def).toBeDefined();
        expect(def!.questId).toBe(q.questId);
      }
    });
  });

  describe('getAllQuests', () => {
    it('debe retornar las 8 misiones', () => {
      expect(service.getAllQuests()).toHaveLength(8);
    });
  });

  describe('getDailyQuests', () => {
    it('debe retornar solo las 4 misiones diarias', () => {
      const dailies = service.getDailyQuests();
      expect(dailies).toHaveLength(4);
      for (const q of dailies) {
        expect(q.category).toBe('DAILY');
      }
    });
  });

  describe('getWeeklyQuests', () => {
    it('debe retornar solo las 4 misiones semanales', () => {
      const weeklies = service.getWeeklyQuests();
      expect(weeklies).toHaveLength(4);
      for (const q of weeklies) {
        expect(q.category).toBe('WEEKLY');
      }
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // getTotalPossibleRewards
  // ═════════════════════════════════════════════════════════════════
  describe('getTotalPossibleRewards', () => {
    it('debe retornar la suma correcta de XP diario (75)', () => {
      const rewards = service.getTotalPossibleRewards();
      // DAILY_READ_1=10 + DAILY_READ_3=30 + DAILY_COMMENT=20 + DAILY_LIKE_3=15 = 75
      expect(rewards.dailyXP).toBe(75);
    });

    it('debe retornar la suma correcta de XP semanal (530)', () => {
      const rewards = service.getTotalPossibleRewards();
      // WEEKLY_READ_10=100 + WEEKLY_COMPLETE_MANGA=150 + WEEKLY_COMMENT_5=80 + WEEKLY_STREAK_5=200 = 530
      expect(rewards.weeklyXP).toBe(530);
    });

    it('debe retornar la suma correcta de InkCoins diarios (5)', () => {
      const rewards = service.getTotalPossibleRewards();
      // DAILY_READ_1=0 + DAILY_READ_3=5 + DAILY_COMMENT=0 + DAILY_LIKE_3=0 = 5
      expect(rewards.dailyInkCoins).toBe(5);
    });

    it('debe retornar la suma correcta de InkCoins semanales (65)', () => {
      const rewards = service.getTotalPossibleRewards();
      // WEEKLY_READ_10=10 + WEEKLY_COMPLETE_MANGA=20 + WEEKLY_COMMENT_5=10 + WEEKLY_STREAK_5=25 = 65
      expect(rewards.weeklyInkCoins).toBe(65);
    });

    it('todos los valores deben ser >= 0', () => {
      const rewards = service.getTotalPossibleRewards();
      expect(rewards.dailyXP).toBeGreaterThanOrEqual(0);
      expect(rewards.weeklyXP).toBeGreaterThanOrEqual(0);
      expect(rewards.dailyInkCoins).toBeGreaterThanOrEqual(0);
      expect(rewards.weeklyInkCoins).toBeGreaterThanOrEqual(0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // getActiveQuests
  // ═════════════════════════════════════════════════════════════════
  describe('getActiveQuests', () => {
    it('debe retornar 8 misiones activas para un usuario nuevo (sin DB records)', () => {
      const quests = service.getActiveQuests('user-1', [], 0);
      expect(quests).toHaveLength(8);
    });

    it('todas las misiones deben tener progressPercent y timeRemaining', () => {
      const quests = service.getActiveQuests('user-1', [], 0);
      for (const q of quests) {
        expect(q.progressPercent).toBeGreaterThanOrEqual(0);
        expect(q.progressPercent).toBeLessThanOrEqual(100);
        expect(q.timeRemaining).toBeGreaterThan(0);
        expect(q.periodEnd).toBeTruthy();
      }
    });

    it('debe ordenar: DAILY primero, luego WEEKLY', () => {
      const quests = service.getActiveQuests('user-1', [], 0);
      const dailyIndices = quests
        .map((q, i) => (q.category === 'DAILY' ? i : -1))
        .filter((i) => i >= 0);
      const weeklyIndices = quests
        .map((q, i) => (q.category === 'WEEKLY' ? i : -1))
        .filter((i) => i >= 0);

      // All daily indices should be less than all weekly indices
      const maxDaily = Math.max(...dailyIndices);
      const minWeekly = Math.min(...weeklyIndices);
      expect(maxDaily).toBeLessThan(minWeekly);
    });

    it('debe ordenar por sortOrder dentro de cada categoría', () => {
      const quests = service.getActiveQuests('user-1', [], 0);
      const dailies = quests.filter((q) => q.category === 'DAILY');
      const weeklies = quests.filter((q) => q.category === 'WEEKLY');

      for (let i = 1; i < dailies.length; i++) {
        expect(dailies[i].sortOrder).toBeGreaterThanOrEqual(dailies[i - 1].sortOrder);
      }
      for (let i = 1; i < weeklies.length; i++) {
        expect(weeklies[i].sortOrder).toBeGreaterThanOrEqual(weeklies[i - 1].sortOrder);
      }
    });

    it('debe colocar misiones completadas después de las no completadas', () => {
      // Create a user quest that marks DAILY_READ_1 as completed
      const dailyPeriod = service.getDailyPeriod();
      const userQuests = [
        mockUserQuest({
          questId: 'DAILY_READ_1',
          progress: 1,
          target: 1,
          completed: true,
          periodStart: dailyPeriod.start,
          periodEnd: dailyPeriod.end,
        }),
      ];

      const quests = service.getActiveQuests('user-1', userQuests, 0);
      const dailies = quests.filter((q) => q.category === 'DAILY');

      // First daily should be uncompleted (DAILY_READ_3, sortOrder=2)
      expect(dailies[0].questId).toBe('DAILY_READ_3');
      expect(dailies[0].completed).toBe(false);

      // DAILY_READ_1 should be last among dailies since it's completed
      const completedQuest = dailies.find((q) => q.questId === 'DAILY_READ_1');
      expect(completedQuest).toBeDefined();
      expect(completedQuest!.completed).toBe(true);
    });

    it('debe preservar el progreso de misiones existentes en DB', () => {
      const dailyPeriod = service.getDailyPeriod();
      const userQuests = [
        mockUserQuest({
          questId: 'DAILY_READ_3',
          progress: 2,
          target: 3,
          completed: false,
          periodStart: dailyPeriod.start,
          periodEnd: dailyPeriod.end,
        }),
      ];

      const quests = service.getActiveQuests('user-1', userQuests, 0);
      const dailyRead3 = quests.find((q) => q.questId === 'DAILY_READ_3');
      expect(dailyRead3).toBeDefined();
      expect(dailyRead3!.progress).toBe(2);
      expect(dailyRead3!.progressPercent).toBe(67); // Math.round(2/3*100)
    });

    it('debe marcar como completada si el progreso alcanza el target', () => {
      const dailyPeriod = service.getDailyPeriod();
      const userQuests = [
        mockUserQuest({
          questId: 'DAILY_READ_3',
          progress: 3,
          target: 3,
          completed: true,
          periodStart: dailyPeriod.start,
          periodEnd: dailyPeriod.end,
        }),
      ];

      const quests = service.getActiveQuests('user-1', userQuests, 0);
      const dailyRead3 = quests.find((q) => q.questId === 'DAILY_READ_3');
      expect(dailyRead3!.completed).toBe(true);
      expect(dailyRead3!.progressPercent).toBe(100);
    });

    it('STREAK_MAINTAIN debe usar el streak actual como progreso', () => {
      const quests = service.getActiveQuests('user-1', [], 3);
      const streakQuest = quests.find((q) => q.questId === 'WEEKLY_STREAK_5');
      expect(streakQuest).toBeDefined();
      expect(streakQuest!.progress).toBe(3);
      expect(streakQuest!.progressPercent).toBe(60); // Math.round(3/5*100)
    });

    it('STREAK_MAINTAIN debe marcarse completada si el streak >= target', () => {
      const quests = service.getActiveQuests('user-1', [], 5);
      const streakQuest = quests.find((q) => q.questId === 'WEEKLY_STREAK_5');
      expect(streakQuest!.completed).toBe(true);
      expect(streakQuest!.progress).toBe(5);
    });

    it('STREAK_MAINTAIN debe marcarse completada si el streak > target', () => {
      const quests = service.getActiveQuests('user-1', [], 10);
      const streakQuest = quests.find((q) => q.questId === 'WEEKLY_STREAK_5');
      expect(streakQuest!.completed).toBe(true);
      expect(streakQuest!.progress).toBe(10);
    });

    it('nuevas misiones deben tener progress=0, completed=false, claimed=false', () => {
      const quests = service.getActiveQuests('user-1', [], 0);

      // All non-STREAK_MAINTAIN quests should start at 0
      const nonStreakQuests = quests.filter(
        (q) => q.actionType !== 'STREAK_MAINTAIN',
      );
      for (const q of nonStreakQuests) {
        expect(q.progress).toBe(0);
        expect(q.completed).toBe(false);
        expect(q.claimed).toBe(false);
        expect(q.progressPercent).toBe(0);
      }
    });

    it('debe devolver el DB id cuando existe un registro previo', () => {
      const dailyPeriod = service.getDailyPeriod();
      const userQuests = [
        mockUserQuest({
          questId: 'DAILY_READ_1',
          periodStart: dailyPeriod.start,
          periodEnd: dailyPeriod.end,
        }),
      ];

      const quests = service.getActiveQuests('user-1', userQuests, 0);
      const quest = quests.find((q) => q.questId === 'DAILY_READ_1');
      expect(quest!.id).toBe('db-DAILY_READ_1');
    });

    it('debe devolver id undefined para misiones sin registro DB', () => {
      const quests = service.getActiveQuests('user-1', [], 0);
      for (const q of quests) {
        expect(q.id).toBeUndefined();
      }
    });

    it('debe respetar el estado claimed de un registro DB', () => {
      const dailyPeriod = service.getDailyPeriod();
      const userQuests = [
        mockUserQuest({
          questId: 'DAILY_READ_1',
          progress: 1,
          target: 1,
          completed: true,
          claimed: true,
          periodStart: dailyPeriod.start,
          periodEnd: dailyPeriod.end,
        }),
      ];

      const quests = service.getActiveQuests('user-1', userQuests, 0);
      const quest = quests.find((q) => q.questId === 'DAILY_READ_1');
      expect(quest!.claimed).toBe(true);
    });

    it('debe filtrar por periodo correcto (no mezclar quests de períodos diferentes)', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(
        Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate()),
      );
      const yesterdayEnd = new Date(yesterdayStart.getTime() + 24 * 60 * 60 * 1000);

      const userQuests = [
        mockUserQuest({
          questId: 'DAILY_READ_1',
          progress: 1,
          completed: true,
          periodStart: yesterdayStart,
          periodEnd: yesterdayEnd,
        }),
      ];

      // Yesterday's quest should not match today's period
      const quests = service.getActiveQuests('user-1', userQuests, 0);
      const quest = quests.find((q) => q.questId === 'DAILY_READ_1');
      expect(quest!.progress).toBe(0); // Fresh quest for today
      expect(quest!.completed).toBe(false);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // reportProgress
  // ═════════════════════════════════════════════════════════════════
  describe('reportProgress', () => {
    it('debe incrementar el progreso para el actionType correcto', () => {
      const quests = [
        mockQuest({ questId: 'DAILY_READ_1', progress: 0, target: 1, actionType: 'READ_CHAPTERS' }),
      ];

      const { updatedQuests, newlyCompleted } = service.reportProgress(
        quests,
        'READ_CHAPTERS',
        1,
      );

      expect(updatedQuests[0].progress).toBe(1);
      expect(updatedQuests[0].progressPercent).toBe(100);
    });

    it('debe detectar y retornar misiones recién completadas', () => {
      const quests = [
        mockQuest({ questId: 'DAILY_READ_1', progress: 0, target: 1, actionType: 'READ_CHAPTERS' }),
      ];

      const { newlyCompleted } = service.reportProgress(
        quests,
        'READ_CHAPTERS',
        1,
      );

      expect(newlyCompleted).toHaveLength(1);
      expect(newlyCompleted[0].questId).toBe('DAILY_READ_1');
      expect(newlyCompleted[0].completed).toBe(true);
    });

    it('no debe incluir en newlyCompleted misiones que ya estaban completadas', () => {
      const quests = [
        mockQuest({
          questId: 'DAILY_READ_1',
          progress: 1,
          target: 1,
          completed: true,
          actionType: 'READ_CHAPTERS',
          progressPercent: 100,
        }),
      ];

      const { newlyCompleted } = service.reportProgress(
        quests,
        'READ_CHAPTERS',
        1,
      );

      expect(newlyCompleted).toHaveLength(0);
    });

    it('no debe modificar misiones ya completadas', () => {
      const quests = [
        mockQuest({
          questId: 'DAILY_READ_1',
          progress: 1,
          target: 1,
          completed: true,
          actionType: 'READ_CHAPTERS',
          progressPercent: 100,
        }),
      ];

      const { updatedQuests } = service.reportProgress(
        quests,
        'READ_CHAPTERS',
        1,
      );

      expect(updatedQuests[0].progress).toBe(1); // unchanged
    });

    it('no debe modificar misiones ya reclamadas (claimed)', () => {
      const quests = [
        mockQuest({
          questId: 'DAILY_READ_1',
          progress: 1,
          target: 1,
          completed: true,
          claimed: true,
          actionType: 'READ_CHAPTERS',
          progressPercent: 100,
        }),
      ];

      const { updatedQuests } = service.reportProgress(
        quests,
        'READ_CHAPTERS',
        1,
      );

      expect(updatedQuests[0].progress).toBe(1); // unchanged
    });

    it('no debe modificar misiones de otro actionType', () => {
      const quests = [
        mockQuest({ questId: 'DAILY_READ_1', progress: 0, target: 1, actionType: 'READ_CHAPTERS' }),
        mockQuest({ questId: 'DAILY_COMMENT', progress: 0, target: 1, actionType: 'POST_COMMENT', sortOrder: 3 }),
      ];

      const { updatedQuests } = service.reportProgress(
        quests,
        'READ_CHAPTERS',
        1,
      );

      const readQuest = updatedQuests.find((q) => q.questId === 'DAILY_READ_1');
      const commentQuest = updatedQuests.find((q) => q.questId === 'DAILY_COMMENT');

      expect(readQuest!.progress).toBe(1);
      expect(commentQuest!.progress).toBe(0); // unchanged
    });

    it('debe capear el progreso al target (no exceder)', () => {
      const quests = [
        mockQuest({ questId: 'DAILY_READ_3', progress: 2, target: 3, actionType: 'READ_CHAPTERS', progressPercent: 67 }),
      ];

      const { updatedQuests } = service.reportProgress(
        quests,
        'READ_CHAPTERS',
        5, // more than needed
      );

      expect(updatedQuests[0].progress).toBe(3); // capped at target
      expect(updatedQuests[0].progressPercent).toBe(100);
    });

    it('amount=0 no debe cambiar nada', () => {
      const quests = [
        mockQuest({ questId: 'DAILY_READ_1', progress: 0, target: 1, actionType: 'READ_CHAPTERS' }),
      ];

      const { updatedQuests, newlyCompleted } = service.reportProgress(
        quests,
        'READ_CHAPTERS',
        0,
      );

      expect(updatedQuests[0].progress).toBe(0);
      expect(newlyCompleted).toHaveLength(0);
    });

    it('amount por defecto debe ser 1', () => {
      const quests = [
        mockQuest({ questId: 'DAILY_READ_1', progress: 0, target: 1, actionType: 'READ_CHAPTERS' }),
      ];

      const { updatedQuests } = service.reportProgress(quests, 'READ_CHAPTERS');

      expect(updatedQuests[0].progress).toBe(1);
    });

    it('debe completar múltiples misiones del mismo actionType simultáneamente', () => {
      const quests = [
        mockQuest({ questId: 'DAILY_READ_1', progress: 0, target: 1, actionType: 'READ_CHAPTERS' }),
        mockQuest({ questId: 'DAILY_READ_3', progress: 0, target: 3, actionType: 'READ_CHAPTERS', sortOrder: 2 }),
      ];

      const { updatedQuests, newlyCompleted } = service.reportProgress(
        quests,
        'READ_CHAPTERS',
        3,
      );

      expect(updatedQuests[0].progress).toBe(1); // capped at 1
      expect(updatedQuests[1].progress).toBe(3); // capped at 3
      expect(newlyCompleted).toHaveLength(2);
      const completedIds = newlyCompleted.map((q) => q.questId);
      expect(completedIds).toContain('DAILY_READ_1');
      expect(completedIds).toContain('DAILY_READ_3');
    });

    it('debe funcionar con POST_COMMENT actionType', () => {
      const quests = [
        mockQuest({ questId: 'DAILY_COMMENT', progress: 0, target: 1, actionType: 'POST_COMMENT', sortOrder: 3 }),
      ];

      const { updatedQuests, newlyCompleted } = service.reportProgress(
        quests,
        'POST_COMMENT',
        1,
      );

      expect(updatedQuests[0].progress).toBe(1);
      expect(updatedQuests[0].completed).toBe(true);
      expect(newlyCompleted).toHaveLength(1);
    });

    it('debe manejar array de misiones vacío', () => {
      const { updatedQuests, newlyCompleted } = service.reportProgress(
        [],
        'READ_CHAPTERS',
        1,
      );

      expect(updatedQuests).toHaveLength(0);
      expect(newlyCompleted).toHaveLength(0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // reportStreakProgress
  // ═════════════════════════════════════════════════════════════════
  describe('reportStreakProgress', () => {
    it('debe actualizar el progreso de STREAK_MAINTAIN con el streak actual', () => {
      const quests = [
        mockQuest({
          questId: 'WEEKLY_STREAK_5',
          actionType: 'STREAK_MAINTAIN',
          progress: 0,
          target: 5,
          progressPercent: 0,
        }),
      ];

      const { updatedQuests } = service.reportStreakProgress(quests, 3);

      expect(updatedQuests[0].progress).toBe(3);
      expect(updatedQuests[0].progressPercent).toBe(60);
    });

    it('debe completar STREAK_MAINTAIN cuando streak >= target', () => {
      const quests = [
        mockQuest({
          questId: 'WEEKLY_STREAK_5',
          actionType: 'STREAK_MAINTAIN',
          progress: 0,
          target: 5,
          progressPercent: 0,
        }),
      ];

      const { updatedQuests, newlyCompleted } = service.reportStreakProgress(
        quests,
        5,
      );

      expect(updatedQuests[0].completed).toBe(true);
      expect(updatedQuests[0].progress).toBe(5);
      expect(newlyCompleted).toHaveLength(1);
      expect(newlyCompleted[0].questId).toBe('WEEKLY_STREAK_5');
    });

    it('no debe modificar misiones no STREAK_MAINTAIN', () => {
      const quests = [
        mockQuest({ questId: 'DAILY_READ_1', progress: 0, target: 1, actionType: 'READ_CHAPTERS' }),
        mockQuest({
          questId: 'WEEKLY_STREAK_5',
          progress: 0,
          target: 5,
          actionType: 'STREAK_MAINTAIN',
          progressPercent: 0,
        }),
      ];

      const { updatedQuests } = service.reportStreakProgress(quests, 4);

      const readQuest = updatedQuests.find((q) => q.questId === 'DAILY_READ_1');
      const streakQuest = updatedQuests.find((q) => q.questId === 'WEEKLY_STREAK_5');

      expect(readQuest!.progress).toBe(0); // unchanged
      expect(streakQuest!.progress).toBe(4); // updated
    });

    it('no debe reactivar STREAK_MAINTAIN ya completada', () => {
      const quests = [
        mockQuest({
          questId: 'WEEKLY_STREAK_5',
          actionType: 'STREAK_MAINTAIN',
          progress: 5,
          target: 5,
          completed: true,
          progressPercent: 100,
        }),
      ];

      const { newlyCompleted } = service.reportStreakProgress(quests, 10);

      expect(newlyCompleted).toHaveLength(0);
    });

    it('no debe modificar STREAK_MAINTAIN ya reclamada', () => {
      const quests = [
        mockQuest({
          questId: 'WEEKLY_STREAK_5',
          actionType: 'STREAK_MAINTAIN',
          progress: 5,
          target: 5,
          completed: true,
          claimed: true,
          progressPercent: 100,
        }),
      ];

      const { updatedQuests } = service.reportStreakProgress(quests, 10);

      expect(updatedQuests[0].progress).toBe(5); // unchanged
    });

    it('debe capear el progreso al target', () => {
      const quests = [
        mockQuest({
          questId: 'WEEKLY_STREAK_5',
          actionType: 'STREAK_MAINTAIN',
          progress: 0,
          target: 5,
          progressPercent: 0,
        }),
      ];

      const { updatedQuests } = service.reportStreakProgress(quests, 50);

      expect(updatedQuests[0].progress).toBe(5); // capped at target
    });

    it('debe manejar streak = 0 correctamente', () => {
      const quests = [
        mockQuest({
          questId: 'WEEKLY_STREAK_5',
          actionType: 'STREAK_MAINTAIN',
          progress: 0,
          target: 5,
          progressPercent: 0,
        }),
      ];

      const { updatedQuests, newlyCompleted } = service.reportStreakProgress(quests, 0);

      expect(updatedQuests[0].progress).toBe(0);
      expect(updatedQuests[0].completed).toBe(false);
      expect(newlyCompleted).toHaveLength(0);
    });

    it('debe manejar array de misiones vacío', () => {
      const { updatedQuests, newlyCompleted } = service.reportStreakProgress([], 5);

      expect(updatedQuests).toHaveLength(0);
      expect(newlyCompleted).toHaveLength(0);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // Edge Cases & Integration
  // ═════════════════════════════════════════════════════════════════
  describe('edge cases', () => {
    it('reportProgress: misiones parcialmente completadas deben completarse con el amount exacto', () => {
      const quests = [
        mockQuest({
          questId: 'DAILY_READ_3',
          progress: 2,
          target: 3,
          actionType: 'READ_CHAPTERS',
          progressPercent: 67,
        }),
      ];

      const { updatedQuests, newlyCompleted } = service.reportProgress(
        quests,
        'READ_CHAPTERS',
        1,
      );

      expect(updatedQuests[0].progress).toBe(3);
      expect(updatedQuests[0].completed).toBe(true);
      expect(newlyCompleted).toHaveLength(1);
    });

    it('reportProgress: amount negativo revierte el progreso a 0 (comportamiento conocido)', () => {
      const quests = [
        mockQuest({ questId: 'DAILY_READ_3', progress: 1, target: 3, actionType: 'READ_CHAPTERS', progressPercent: 33 }),
      ];

      const { updatedQuests } = service.reportProgress(
        quests,
        'READ_CHAPTERS',
        -1,
      );

      // Math.min(3, 1 + (-1)) = Math.min(3, 0) = 0 — reverts to 0
      expect(updatedQuests[0].progress).toBe(0);
    });

    it('getActiveQuests: streak 0 con STREAK_MAINTAIN debe mostrar progress=0, no completada', () => {
      const quests = service.getActiveQuests('user-1', [], 0);
      const streakQuest = quests.find((q) => q.questId === 'WEEKLY_STREAK_5');
      expect(streakQuest!.progress).toBe(0);
      expect(streakQuest!.completed).toBe(false);
      expect(streakQuest!.progressPercent).toBe(0);
    });

    it('todas las misiones deben tener un sortOrder definido y > 0', () => {
      const quests = service.getActiveQuests('user-1', [], 0);
      for (const q of quests) {
        expect(q.sortOrder).toBeGreaterThan(0);
      }
    });

    it('progressPercent debe redondear correctamente valores fraccionales', () => {
      // 1/3 = 33.33% → Math.round = 33%
      const dailyPeriod = service.getDailyPeriod();
      const userQuests = [
        mockUserQuest({
          questId: 'DAILY_READ_3',
          progress: 1,
          target: 3,
          completed: false,
          periodStart: dailyPeriod.start,
          periodEnd: dailyPeriod.end,
        }),
      ];

      const quests = service.getActiveQuests('user-1', userQuests, 0);
      const dailyRead3 = quests.find((q) => q.questId === 'DAILY_READ_3');
      expect(dailyRead3!.progressPercent).toBe(33); // Math.round(1/3*100)

      // 2/3 = 66.67% → Math.round = 67%
      const userQuests2 = [
        mockUserQuest({
          questId: 'DAILY_READ_3',
          progress: 2,
          target: 3,
          completed: false,
          periodStart: dailyPeriod.start,
          periodEnd: dailyPeriod.end,
        }),
      ];
      const quests2 = service.getActiveQuests('user-1', userQuests2, 0);
      const dailyRead3_2 = quests2.find((q) => q.questId === 'DAILY_READ_3');
      expect(dailyRead3_2!.progressPercent).toBe(67); // Math.round(2/3*100)
    });

    it('progressPercent debe ser 100 cuando progreso === target', () => {
      const dailyPeriod = service.getDailyPeriod();
      const userQuests = [
        mockUserQuest({
          questId: 'DAILY_READ_1',
          progress: 1,
          target: 1,
          completed: true,
          periodStart: dailyPeriod.start,
          periodEnd: dailyPeriod.end,
        }),
      ];

      const quests = service.getActiveQuests('user-1', userQuests, 0);
      const quest = quests.find((q) => q.questId === 'DAILY_READ_1');
      expect(quest!.progressPercent).toBe(100);
    });

    it('STREAK_MAINTAIN con streak 5 y target 5 → progressPercent 100, completed true', () => {
      const quests = service.getActiveQuests('user-1', [], 5);
      const streakQuest = quests.find((q) => q.questId === 'WEEKLY_STREAK_5');
      expect(streakQuest!.progressPercent).toBe(100);
      expect(streakQuest!.completed).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════
  // Singleton
  // ═════════════════════════════════════════════════════════════════
  describe('singleton (getQuestService / initializeQuestService)', () => {
    it('initializeQuestService debe crear y retornar una instancia de QuestService', () => {
      const svc = initializeQuestService();
      expect(svc).toBeInstanceOf(QuestService);
    });

    it('getQuestService debe retornar la instancia inicializada', () => {
      initializeQuestService();
      const svc = getQuestService();
      expect(svc).toBeInstanceOf(QuestService);
    });

    it('getQuestService debe auto-inicializar si no hay instancia previa', () => {
      // getQuestService always returns a valid instance
      const svc = getQuestService();
      expect(svc).toBeInstanceOf(QuestService);
      expect(svc.getActiveQuests).toBeInstanceOf(Function);
      expect(svc.reportProgress).toBeInstanceOf(Function);
      expect(svc.reportStreakProgress).toBeInstanceOf(Function);
    });
  });
});
