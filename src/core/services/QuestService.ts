/**
 * QuestService - Core engine for daily/weekly quests and challenges
 *
 * Implements short-term goal psychology:
 * - Daily quests: small, achievable tasks that reset every 24h
 * - Weekly quests: larger goals that reset every Monday
 * - Progress tracking with visual feedback
 * - XP + Aura rewards on completion
 * - Streak synergy: quests that reward maintaining streaks
 *
 * @packageDocumentation
 */

export type QuestCategory = 'DAILY' | 'WEEKLY' | 'SPECIAL';
export type QuestActionType = 'READ_CHAPTERS' | 'POST_COMMENT' | 'LIKE_COMMENTS' |
  'COMPLETE_MANGA' | 'STREAK_MAINTAIN' | 'CORRECT_CHAPTER';

export interface QuestDefinition {
  questId: string;
  category: QuestCategory;
  actionType: QuestActionType;
  target: number;
  xpReward: number;
  auraReward: number;
  label: string;
  description: string;
  iconName: string;
  sortOrder: number;
}

export interface ActiveQuest {
  questId: string;
  category: QuestCategory;
  actionType: QuestActionType;
  label: string;
  description: string;
  iconName: string;
  target: number;
  progress: number;
  xpReward: number;
  auraReward: number;
  completed: boolean;
  claimed: boolean;
  sortOrder: number;
  /** Percentage progress (0-100) */
  progressPercent: number;
  /** Time remaining in milliseconds */
  timeRemaining: number;
  /** Period end as ISO string */
  periodEnd: string;
  /** Database ID for claiming */
  id?: string;
}

export interface QuestProgressResult {
  /** Quests that were completed by this progress update */
  completedQuests: ActiveQuest[];
}

/**
 * Daily quest definitions — reset every 24h at midnight UTC
 */
export const DAILY_QUESTS: QuestDefinition[] = [
  {
    questId: 'DAILY_READ_1',
    category: 'DAILY',
    actionType: 'READ_CHAPTERS',
    target: 1,
    xpReward: 10,
    auraReward: 0,
    label: 'Lector Diario',
    description: 'Lee 1 capítulo hoy',
    iconName: 'BookOpen',
    sortOrder: 1,
  },
  {
    questId: 'DAILY_READ_3',
    category: 'DAILY',
    actionType: 'READ_CHAPTERS',
    target: 3,
    xpReward: 30,
    auraReward: 5,
    label: 'Maratón de Capítulos',
    description: 'Lee 3 capítulos hoy',
    iconName: 'Zap',
    sortOrder: 2,
  },
  {
    questId: 'DAILY_COMMENT',
    category: 'DAILY',
    actionType: 'POST_COMMENT',
    target: 1,
    xpReward: 20,
    auraReward: 0,
    label: 'Opinión Diaria',
    description: 'Publica 1 comentario hoy',
    iconName: 'MessageSquare',
    sortOrder: 3,
  },
  {
    questId: 'DAILY_LIKE_3',
    category: 'DAILY',
    actionType: 'LIKE_COMMENTS',
    target: 3,
    xpReward: 15,
    auraReward: 0,
    label: 'Buen Gusto',
    description: 'Dale like a 3 comentarios hoy',
    iconName: 'Heart',
    sortOrder: 4,
  },
];

/**
 * Weekly quest definitions — reset every Monday at midnight UTC
 */
export const WEEKLY_QUESTS: QuestDefinition[] = [
  {
    questId: 'WEEKLY_READ_10',
    category: 'WEEKLY',
    actionType: 'READ_CHAPTERS',
    target: 10,
    xpReward: 100,
    auraReward: 10,
    label: 'Lector Semanal',
    description: 'Lee 10 capítulos esta semana',
    iconName: 'BookOpenCheck',
    sortOrder: 1,
  },
  {
    questId: 'WEEKLY_COMPLETE_MANGA',
    category: 'WEEKLY',
    actionType: 'COMPLETE_MANGA',
    target: 1,
    xpReward: 150,
    auraReward: 20,
    label: 'Finalizador',
    description: 'Completa 1 manga esta semana',
    iconName: 'CheckCircle',
    sortOrder: 2,
  },
  {
    questId: 'WEEKLY_COMMENT_5',
    category: 'WEEKLY',
    actionType: 'POST_COMMENT',
    target: 5,
    xpReward: 80,
    auraReward: 10,
    label: 'Conversador',
    description: 'Publica 5 comentarios esta semana',
    iconName: 'MessagesSquare',
    sortOrder: 3,
  },
  {
    questId: 'WEEKLY_STREAK_5',
    category: 'WEEKLY',
    actionType: 'STREAK_MAINTAIN',
    target: 5,
    xpReward: 200,
    auraReward: 25,
    label: 'Disciplina Semanal',
    description: 'Mantén tu racha por 5 días esta semana',
    iconName: 'Flame',
    sortOrder: 4,
  },
];

/** All quest definitions */
export const ALL_QUESTS: QuestDefinition[] = [...DAILY_QUESTS, ...WEEKLY_QUESTS];

/** Map from questId to definition for fast lookup */
const QUEST_MAP = new Map<string, QuestDefinition>();
for (const q of ALL_QUESTS) {
  QUEST_MAP.set(q.questId, q);
}

export class QuestService {
  /**
   * Get the daily period (midnight to midnight UTC)
   */
  getDailyPeriod(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return { start, end };
  }

  /**
   * Get the weekly period (Monday to Monday UTC)
   */
  getWeeklyPeriod(): { start: Date; end: Date } {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sunday, 1=Monday
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysFromMonday,
    ));
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  /**
   * Get active quests for a user, creating them if they don't exist yet
   * @param userId - User ID
   * @param userQuests - Existing UserQuest records from DB
   * @param userStreak - Current user streak (for STREAK_MAINTAIN quests)
   */
  getActiveQuests(
    _userId: string,
    userQuests: Array<{
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
    }>,
    userStreak: number = 0,
  ): ActiveQuest[] {
    const dailyPeriod = this.getDailyPeriod();
    const weeklyPeriod = this.getWeeklyPeriod();
    const now = Date.now();

    const active: ActiveQuest[] = [];

    for (const questDef of ALL_QUESTS) {
      const period = questDef.category === 'DAILY' ? dailyPeriod : weeklyPeriod;
      const periodEnd = period.end;

      // Time remaining
      const timeRemaining = Math.max(0, periodEnd.getTime() - now);

      // Find existing progress or create new
      const existing = userQuests.find(
        (uq) =>
          uq.questId === questDef.questId &&
          uq.periodStart.getTime() === period.start.getTime(),
      );

      // For STREAK_MAINTAIN, progress is the current streak
      const progress =
        questDef.actionType === 'STREAK_MAINTAIN'
          ? userStreak
          : existing?.progress ?? 0;

      const completed =
        questDef.actionType === 'STREAK_MAINTAIN'
          ? userStreak >= questDef.target
          : existing?.completed ?? false;

      const progressPercent = Math.min(
        100,
        Math.round((progress / questDef.target) * 100),
      );

      active.push({
        questId: questDef.questId,
        category: questDef.category,
        actionType: questDef.actionType,
        label: questDef.label,
        description: questDef.description,
        iconName: questDef.iconName,
        target: questDef.target,
        progress,
        xpReward: questDef.xpReward,
        auraReward: questDef.auraReward,
        completed,
        claimed: existing?.claimed ?? false,
        sortOrder: questDef.sortOrder,
        progressPercent,
        timeRemaining,
        periodEnd: periodEnd.toISOString(),
        id: existing?.id,
      });
    }

    // Sort: DAILY first, then by sortOrder. Uncompleted first, completed last
    return active.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category === 'DAILY' ? -1 : 1;
      }
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return a.sortOrder - b.sortOrder;
    });
  }

  /**
   * Report progress on an action and return any quests that were just completed.
   * Returns the full list of active quests after progress update.
   */
  reportProgress(
    currentQuests: ActiveQuest[],
    actionType: QuestActionType,
    amount: number = 1,
  ): { updatedQuests: ActiveQuest[]; newlyCompleted: ActiveQuest[] } {
    const newlyCompleted: ActiveQuest[] = [];

    const updatedQuests = currentQuests.map((q) => {
      // Only update matching action types, and only if not yet completed
      if (q.actionType !== actionType || q.completed || q.claimed) {
        return q;
      }

      const newProgress = Math.min(q.target, q.progress + amount);
      const nowCompleted = newProgress >= q.target && !q.completed;

      const updated: ActiveQuest = {
        ...q,
        progress: newProgress,
        progressPercent: Math.min(100, Math.round((newProgress / q.target) * 100)),
        completed: nowCompleted || q.completed,
      };

      if (nowCompleted) {
        newlyCompleted.push(updated);
      }

      return updated;
    });

    return { updatedQuests, newlyCompleted };
  }

  /**
   * Report streak progress on STREAK_MAINTAIN quests
   */
  reportStreakProgress(
    currentQuests: ActiveQuest[],
    currentStreak: number,
  ): { updatedQuests: ActiveQuest[]; newlyCompleted: ActiveQuest[] } {
    const newlyCompleted: ActiveQuest[] = [];

    const updatedQuests = currentQuests.map((q) => {
      if (q.actionType !== 'STREAK_MAINTAIN' || q.completed || q.claimed) {
        return q;
      }

      const newProgress = Math.min(q.target, currentStreak);
      const nowCompleted = newProgress >= q.target && !q.completed;

      const updated: ActiveQuest = {
        ...q,
        progress: newProgress,
        progressPercent: Math.min(100, Math.round((newProgress / q.target) * 100)),
        completed: nowCompleted || q.completed,
      };

      if (nowCompleted) {
        newlyCompleted.push(updated);
      }

      return updated;
    });

    return { updatedQuests, newlyCompleted };
  }

  /**
   * Get a quest definition by ID
   */
  getQuestDefinition(questId: string): QuestDefinition | undefined {
    return QUEST_MAP.get(questId);
  }

  /**
   * Get all quest definitions
   */
  getAllQuests(): QuestDefinition[] {
    return ALL_QUESTS;
  }

  /**
   * Get daily quest definitions
   */
  getDailyQuests(): QuestDefinition[] {
    return DAILY_QUESTS;
  }

  /**
   * Get weekly quest definitions
   */
  getWeeklyQuests(): QuestDefinition[] {
    return WEEKLY_QUESTS;
  }

  /**
   * Calculate total possible XP from all quests
   */
  getTotalPossibleRewards(): {
    dailyXP: number;
    weeklyXP: number;
    dailyAura: number;
    weeklyAura: number;
  } {
    const dailyXP = DAILY_QUESTS.reduce((sum, q) => sum + q.xpReward, 0);
    const weeklyXP = WEEKLY_QUESTS.reduce((sum, q) => sum + q.xpReward, 0);
    const dailyAura = DAILY_QUESTS.reduce((sum, q) => sum + q.auraReward, 0);
    const weeklyAura = WEEKLY_QUESTS.reduce((sum, q) => sum + q.auraReward, 0);
    return { dailyXP, weeklyXP, dailyAura, weeklyAura };
  }
}

/** Singleton instance */
export let questService: QuestService | undefined;

export function initializeQuestService(): QuestService {
  const service = new QuestService();
  questService = service;
  return service;
}

export function getQuestService(): QuestService {
  if (!questService) {
    return initializeQuestService();
  }
  return questService;
}

export default QuestService;
