/**
 * StreakService - Core engine for reading streak rewards
 *
 * Implements the psychology of loss aversion + escalating rewards:
 * - Daily streak tracking with date-based comparisons
 * - Escalating XP multiplier based on streak length
 * - Milestone rewards at key thresholds (3, 7, 14, 30, 60, 100, 180, 365 days)
 * - Streak freeze mechanic to protect streaks on missed days
 * - Streak-broken event for loss aversion feedback
 *
 * @packageDocumentation
 */

export interface StreakState {
  /** Current streak count */
  streak: number;
  /** Whether today has already been counted */
  alreadyReadToday: boolean;
  /** Available streak freezes */
  freezesAvailable: number;
  /** Highest milestone claimed (so we don't double-reward) */
  lastMilestone: number;
  /** Bonus XP multiplier for the current streak (0-5) */
  bonusMultiplier: number;
  /** Next milestone in days */
  nextMilestone: number;
  /** Days until next milestone */
  daysToNextMilestone: number;
}

export interface StreakUpdateResult {
  /** New streak value */
  newStreak: number;
  /** Whether the streak increased */
  streakIncreased: boolean;
  /** Whether the streak was broken (reset to 1) */
  streakBroken: boolean;
  /** Whether today was already counted */
  alreadyReadToday: boolean;
  /** Bonus XP awarded this read (from streak multiplier) */
  bonusXP: number;
  /** Milestone rewards triggered this read */
  milestonesTriggered: MilestoneReward[];
  /** Freeze used this read (if any) */
  freezeUsed: boolean;
  /** Remaining freezes after this read */
  freezesRemaining: number;
}

export interface MilestoneReward {
  /** Days milestone */
  days: number;
  /** XP bonus awarded */
  xpBonus: number;
  /** Freezes awarded */
  freezesAwarded: number;
  /** Badge ID for the milestone achievement */
  badgeId: string;
  /** Milestone label */
  label: string;
}

/**
 * Milestone definitions - the reward schedule
 * Ordered from smallest to largest
 */
export const STREAK_MILESTONES: MilestoneReward[] = [
  { days: 3,   xpBonus: 20,   freezesAwarded: 0, badgeId: 'RACHA_3',   label: 'Racha de 3 días' },
  { days: 7,   xpBonus: 50,   freezesAwarded: 1, badgeId: 'RACHA_7',   label: 'Racha de Fuego (7 días)' },
  { days: 14,  xpBonus: 100,  freezesAwarded: 0, badgeId: 'RACHA_14',  label: 'Racha de 14 días' },
  { days: 30,  xpBonus: 200,  freezesAwarded: 1, badgeId: 'RACHA_30',  label: 'Lector Dedicado (30 días)' },
  { days: 60,  xpBonus: 300,  freezesAwarded: 0, badgeId: 'RACHA_60',  label: 'Racha de 60 días' },
  { days: 100, xpBonus: 500,  freezesAwarded: 2, badgeId: 'RACHA_100', label: 'Centenario (100 días)' },
  { days: 180, xpBonus: 750,  freezesAwarded: 0, badgeId: 'RACHA_180', label: 'Racha de 180 días' },
  { days: 365, xpBonus: 2000, freezesAwarded: 3, badgeId: 'RACHA_365', label: 'Año Manga (365 días)' },
];

/** Maximum streak freezes a user can hold */
export const MAX_STREAK_FREEZES = 5;

/** Maximum bonus multiplier from streaks */
export const MAX_STREAK_MULTIPLIER = 5;

export class StreakService {
  /**
   * Calculate streak update based on last read date
   *
   * @param lastReadAt - When the user last read (null for first time)
   * @param currentStreak - Current streak count
   * @param lastMilestone - Highest milestone already claimed
   * @param freezesAvailable - Number of freezes available
   * @param useFreeze - Whether to use a freeze to protect the streak
   * @returns Complete streak update result
   */
  calculateStreakUpdate(
    lastReadAt: Date | null,
    currentStreak: number,
    lastMilestone: number = 0,
    freezesAvailable: number = 2,
    useFreeze: boolean = false,
  ): StreakUpdateResult {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // First time reading ever
    if (!lastReadAt) {
      return {
        newStreak: 1,
        streakIncreased: true,
        streakBroken: false,
        alreadyReadToday: false,
        bonusXP: 0,
        milestonesTriggered: [],
        freezeUsed: false,
        freezesRemaining: freezesAvailable,
      };
    }

    const lastRead = new Date(lastReadAt.getTime());
    lastRead.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastRead.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Already read today - no streak change
    if (diffDays === 0) {
      return {
        newStreak: currentStreak,
        streakIncreased: false,
        streakBroken: false,
        alreadyReadToday: true,
        bonusXP: 0,
        milestonesTriggered: [],
        freezeUsed: false,
        freezesRemaining: freezesAvailable,
      };
    }

    // Read yesterday - increment streak
    if (diffDays === 1) {
      const newStreak = currentStreak + 1;
      const milestones = this.checkMilestones(newStreak, lastMilestone);
      const bonus = this.calculateBonusXP(newStreak);

      return {
        newStreak,
        streakIncreased: true,
        streakBroken: false,
        alreadyReadToday: false,
        bonusXP: bonus,
        milestonesTriggered: milestones,
        freezeUsed: false,
        freezesRemaining: this.calculateNewFreezes(freezesAvailable, milestones),
      };
    }

    // Missed exactly one day but has freezes - use a freeze
    if (diffDays === 2 && useFreeze && freezesAvailable > 0) {
      const newStreak = currentStreak + 1;
      const milestones = this.checkMilestones(newStreak, lastMilestone);
      const bonus = this.calculateBonusXP(newStreak);

      return {
        newStreak,
        streakIncreased: true,
        streakBroken: false,
        alreadyReadToday: false,
        bonusXP: bonus,
        milestonesTriggered: milestones,
        freezeUsed: true,
        freezesRemaining: this.calculateNewFreezes(freezesAvailable - 1, milestones),
      };
    }

    // Missed 2+ days - streak broken
    return {
      newStreak: 1,
      streakIncreased: false,
      streakBroken: true,
      alreadyReadToday: false,
      bonusXP: 0,
      milestonesTriggered: [],
      freezeUsed: false,
      freezesRemaining: freezesAvailable,
    };
  }

  /**
   * Calculate total bonus XP for current reading session
   * Includes both streak multiplier bonus and milestone rewards
   */
  calculateSessionBonus(
    streakUpdate: StreakUpdateResult,
  ): { totalBonusXP: number; multiplierBonus: number; milestoneBonus: number } {
    const milestoneBonus = streakUpdate.milestonesTriggered.reduce(
      (sum, m) => sum + m.xpBonus,
      0,
    );
    const multiplierBonus = streakUpdate.bonusXP;

    return {
      totalBonusXP: multiplierBonus + milestoneBonus,
      multiplierBonus,
      milestoneBonus,
    };
  }

  /**
   * Calculate the streak bonus multiplier XP
   * Formula: floor(streak / 7) extra XP per read, capped at 5
   * So: weeks 1-6 give +0, +1, +2, +3, +4, +5 respectively
   */
  calculateBonusXP(streak: number): number {
    return Math.min(Math.floor(streak / 7), MAX_STREAK_MULTIPLIER);
  }

  /**
   * Get the current streak state for display
   */
  getStreakState(
    streak: number,
    lastReadAt: Date | null,
    freezesAvailable: number,
    lastMilestone: number,
  ): StreakState {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    let alreadyReadToday = false;

    if (lastReadAt) {
      const lastRead = new Date(lastReadAt);
      lastRead.setHours(0, 0, 0, 0);
      alreadyReadToday = today.getTime() === lastRead.getTime();
    }

    const nextMilestone = this.getNextMilestone(streak);
    const daysToNext = nextMilestone ? nextMilestone.days - streak : 0;

    return {
      streak,
      alreadyReadToday,
      freezesAvailable,
      lastMilestone,
      bonusMultiplier: this.calculateBonusXP(streak),
      nextMilestone: nextMilestone?.days ?? 0,
      daysToNextMilestone: daysToNext,
    };
  }

  /**
   * Check which milestones were just reached (and not previously claimed)
   */
  private checkMilestones(
    newStreak: number,
    lastMilestone: number,
  ): MilestoneReward[] {
    return STREAK_MILESTONES.filter(
      (m) => m.days <= newStreak && m.days > lastMilestone,
    );
  }

  /**
   * Calculate new freeze count after applying milestone rewards
   */
  private calculateNewFreezes(
    currentFreezes: number,
    milestones: MilestoneReward[],
  ): number {
    const earnedFreezes = milestones.reduce(
      (sum, m) => sum + m.freezesAwarded,
      0,
    );
    return Math.min(currentFreezes + earnedFreezes, MAX_STREAK_FREEZES);
  }

  /**
   * Get the next milestone the user hasn't reached yet
   */
  private getNextMilestone(currentStreak: number): MilestoneReward | undefined {
    return STREAK_MILESTONES.find((m) => m.days > currentStreak);
  }

  /**
   * Get the highest milestone the user has ever reached (for tracking)
   */
  getHighestMilestoneReached(streak: number): number {
    let highest = 0;
    for (const m of STREAK_MILESTONES) {
      if (streak >= m.days) {
        highest = Math.max(highest, m.days);
      }
    }
    return highest;
  }

  /**
   * Get milestones the user has reached given the current streak
   */
  getReachedMilestones(streak: number): MilestoneReward[] {
    return STREAK_MILESTONES.filter((m) => m.days <= streak);
  }
}

/** Singleton instance */
export let streakService: StreakService | undefined;

export function initializeStreakService(): StreakService {
  const service = new StreakService();
  streakService = service;
  return service;
}

export function getStreakService(): StreakService {
  if (!streakService) {
    return initializeStreakService();
  }
  return streakService;
}

export default StreakService;
