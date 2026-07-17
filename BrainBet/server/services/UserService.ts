/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CONFIG, getRequiredXpForLevel } from '../core/config.js';
import { User } from '../models/types.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { SubmissionRepository } from '../repositories/SubmissionRepository.js';

export class UserService {
  constructor(
    private userRepo = new UserRepository(),
    private submissionRepo = new SubmissionRepository()
  ) {}

  /**
   * Fetches an existing user or creates a new profile with initial values.
   * Performs real-time validation on calendar-day transition resets.
   */
  public getOrCreateUser(telegramId: string, username: string): User {
    let user = this.userRepo.getByTelegramId(telegramId);

    if (!user) {
      // Bootstrap new user in database
      const newUser: User = {
        telegram_id: telegramId,
        username: username || `User_${telegramId.slice(0, 5)}`,
        balance: 100, // Welcome gift of 100 coins
        xp: 0,
        level: 1,
        daily_answer_count: 0,
        daily_limit: CONFIG.GAMIFICATION.DAILY_LIMIT,
        streak: 0,
        last_answered_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      user = this.userRepo.create(newUser);
    } else {
      // If user exists, we check if their daily quota should be reset (calendar day changed)
      const modified = this.evaluateDailyQuotaReset(user);
      if (modified) {
        user = this.userRepo.update(user);
      }
    }

    // Return user along with their active achievements and progress
    return user;
  }

  /**
   * Evaluates if a new calendar day has started since user's last action, 
   * resetting their daily answer count if necessary.
   */
  private evaluateDailyQuotaReset(user: User): boolean {
    if (user.daily_answer_count === 0) return false;

    // Fetch actual submissions logged today to cross-reference
    const submissionsToday = this.submissionRepo.getUserSubmissionsToday(user.telegram_id);
    
    // If no submissions exist for today (UTC), reset answer counter to 0
    if (submissionsToday.length === 0) {
      user.daily_answer_count = 0;
      return true;
    } else {
      // Ensure local count matches physical database logs
      if (user.daily_answer_count !== submissionsToday.length) {
        user.daily_answer_count = submissionsToday.length;
        return true;
      }
    }

    return false;
  }

  /**
   * Recalculates level progression. Level increases dynamically based on XP.
   */
  public addExperienceAndCoins(
    telegramId: string, 
    xpEarned: number, 
    coinsEarned: number, 
    isSubmission = false
  ): { user: User; levelUp: boolean; oldLevel: number; newLevel: number } {
    const user = this.userRepo.getByTelegramId(telegramId);
    if (!user) {
      throw new Error(`User ${telegramId} not found`);
    }

    const oldLevel = user.level;
    user.xp += xpEarned;
    user.balance += coinsEarned;

    // Loop to support multiple level-ups at once
    let currentLevel = user.level;
    while (user.xp >= getRequiredXpForLevel(currentLevel)) {
      user.xp -= getRequiredXpForLevel(currentLevel);
      currentLevel += 1;
    }
    user.level = currentLevel;
    const levelUp = user.level > oldLevel;

    // If it was a valid submission, increment their daily submission tally
    if (isSubmission) {
      user.daily_answer_count += 1;
      const nowStr = new Date().toISOString();
      
      // Streak maintenance logic
      this.maintainStreak(user, nowStr);
      user.last_answered_at = nowStr;
    }

    const updatedUser = this.userRepo.update(user);

    return {
      user: updatedUser,
      levelUp,
      oldLevel,
      newLevel: updatedUser.level
    };
  }

  /**
   * Evaluates active streak counts based on chronological delay boundaries.
   */
  private maintainStreak(user: User, currentTimeIso: string): void {
    if (!user.last_answered_at) {
      // First ever answer establishes a streak of 1
      user.streak = 1;
      return;
    }

    const lastTime = new Date(user.last_answered_at).getTime();
    const currTime = new Date(currentTimeIso).getTime();
    const diffMs = currTime - lastTime;
    const diffHours = diffMs / (1000 * 60 * 60);

    const lastDate = new Date(user.last_answered_at).getUTCDate();
    const currDate = new Date(currentTimeIso).getUTCDate();

    if (lastDate === currDate) {
      // Already answered today, streak maintains its current level
      return;
    }

    if (diffHours < CONFIG.GAMIFICATION.STREAK_RESET_HOURS) {
      // Answered in the subsequent UTC day period, increment streak
      user.streak = Math.min(user.streak + 1, CONFIG.GAMIFICATION.MAX_STREAK_CAP);
    } else {
      // Too much time elapsed (48h+), reset streak to 1
      user.streak = 1;
    }
  }

  /**
   * Retrieves leaderboard ranks
   */
  public getLeaderboard(limit = 10): User[] {
    return this.userRepo.getLeaderboard(limit);
  }

  /**
   * Purchases BrainBet Premium with 20,000 coins
   */
  public purchasePremium(telegramId: string): User {
    const user = this.userRepo.getByTelegramId(telegramId);
    if (!user) {
      throw new Error('Foydalanuvchi topilmadi.');
    }

    if (user.is_premium) {
      throw new Error('Sizda allaqachon BrainBet Premium mavjud!');
    }

    if (user.balance < 20000) {
      throw new Error('Mablag\' yetarli emas. Premium sotib olish uchun 20,000 Coin talab qilinadi.');
    }

    user.balance -= 20000;
    user.is_premium = true;

    return this.userRepo.update(user);
  }

  /**
   * Claims daily bonus specifically for premium users (1,000 Coins every 24 hours)
   */
  public claimPremiumDailyBonus(telegramId: string): { user: User; claimed: number } {
    const user = this.userRepo.getByTelegramId(telegramId);
    if (!user) {
      throw new Error('Foydalanuvchi topilmadi.');
    }

    if (!user.is_premium) {
      throw new Error('Sizda BrainBet Premium faollashtirilmagan!');
    }

    const now = Date.now();
    if (user.last_premium_claim_at) {
      const lastClaim = new Date(user.last_premium_claim_at).getTime();
      const diffMs = now - lastClaim;
      const hoursLeft = 24 - (diffMs / (1000 * 60 * 60));

      if (hoursLeft > 0) {
        const hours = Math.floor(hoursLeft);
        const mins = Math.ceil((hoursLeft - hours) * 60);
        throw new Error(`Premium sovg'ani olishga hali vaqt bor! Iltimos ${hours} soat, ${mins} daqiqa kuting.`);
      }
    }

    const reward = 1000;
    user.balance += reward;
    user.last_premium_claim_at = new Date().toISOString();
    
    const updated = this.userRepo.update(user);
    return { user: updated, claimed: reward };
  }

  /**
   * Directly updates user details in the repository
   */
  public updateUser(user: User): User {
    return this.userRepo.update(user);
  }
}
export const userService = new UserService();
