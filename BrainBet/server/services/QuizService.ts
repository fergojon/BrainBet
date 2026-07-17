/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CONFIG } from '../core/config.js';
import { Submission, Question } from '../models/types.js';
import { QuestionRepository } from '../repositories/QuestionRepository.js';
import { SubmissionRepository } from '../repositories/SubmissionRepository.js';
import { UserService } from './UserService.js';

export interface SubmissionResult {
  is_correct: boolean;
  correct_option: 'A' | 'B' | 'C' | 'D';
  selected_option: 'A' | 'B' | 'C' | 'D';
  earned_coins: number;
  earned_xp: number;
  streak: number;
  daily_answer_count: number;
  daily_limit: number;
  level_up: boolean;
  new_level: number;
  new_xp: number;
  new_balance: number;
  animation_state: {
    sparkles: boolean;
    streak_glow: boolean;
    level_glow: boolean;
  };
}

export class QuizService {
  constructor(
    private questionRepo = new QuestionRepository(),
    private submissionRepo = new SubmissionRepository(),
    private userService = new UserService()
  ) {}

  /**
   * Retrieves random unanswered questions for a user, maintaining high-performance filtering.
   */
  public getQuestionsForUser(
    userId: string,
    difficulty?: 'easy' | 'medium' | 'hard',
    limit = 5,
    category?: string
  ): Question[] {
    // Standard User lookup to register or check quota reset
    const user = this.userService.getOrCreateUser(userId, '');
    
    // Check if daily quota is already breached, although we still let them fetch questions (for practice or review, though submissions are blocked)
    return this.questionRepo.getUnansweredQuestions(user.telegram_id, difficulty, limit, category);
  }

  /**
   * Evaluates a user submission, validates limits, logs submission, and increments rewards.
   */
  public submitAnswer(
    userId: string,
    questionId: string,
    selectedOption: 'A' | 'B' | 'C' | 'D'
  ): SubmissionResult {
    // 1. Resolve User and verify they exist
    const user = this.userService.getOrCreateUser(userId, '');

    // Check if user is banned
    if (user.is_banned) {
      throw new Error(`Siz cheat, bot yoki shubhali faollik sababli blocklangansiz! Sabab: ${user.ban_reason || 'Noma\'lum'}`);
    }

    // Check answer speed (anti-cheat / rate-limit)
    if (user.last_answered_at) {
      const lastTime = new Date(user.last_answered_at).getTime();
      const nowTime = Date.now();
      const timeDiffSeconds = (nowTime - lastTime) / 1000;

      if (timeDiffSeconds < 1.5) {
        // Automatic Ban!
        user.is_banned = true;
        user.ban_reason = 'Avtomatik ban: 1.5 soniyadan kam vaqt ichida tezkor javob yuborish aniqlandi (Bot/Cheat faolligi)';
        this.userService.updateUser(user);
        throw new Error('Siz bot yoki cheatdan foydalanganlikda shubhalanib blocklandingiz! Tizim javob berish tezligini 1.5 soniyadan yuqori bo\'lishini talab qiladi.');
      }
    }

    // 2. Resolve Question and verify existence
    const question = this.questionRepo.getById(questionId);
    if (!question) {
      throw new Error(`Question ${questionId} does not exist in the bank.`);
    }

    // 3. Verify that the user has not already submitted an answer to this question
    const alreadyAnswered = this.submissionRepo.getByUserAndQuestion(userId, questionId);
    if (alreadyAnswered) {
      throw new Error('You have already answered this question.');
    }

    // 4. Assert user daily quotas
    if (user.daily_answer_count >= user.daily_limit) {
      throw new Error(`Daily limit reached! You can only answer ${user.daily_limit} questions per day. Your limit resets at Midnight UTC.`);
    }

    // 5. Evaluate answer correctness
    const isCorrect = question.correct_option === selectedOption;

    // 6. Calculate rewards
    let earnedCoins = 0;
    let earnedXp = 0;

    if (isCorrect) {
      // XP Calculations
      earnedXp = question.reward || CONFIG.GAMIFICATION.XP_PER_CORRECT;
      
      // Coins calculation with streak multiplier bonus
      const baseCoin = question.reward || CONFIG.GAMIFICATION.BASE_COIN_REWARD;
      const streakBonusPercentage = Math.min(
        user.streak * CONFIG.GAMIFICATION.STREAK_MULTIPLIER,
        CONFIG.GAMIFICATION.MAX_STREAK_CAP * CONFIG.GAMIFICATION.STREAK_MULTIPLIER
      );
      
      earnedCoins = Math.round(baseCoin * (1 + streakBonusPercentage));
    } else {
      // Compensation consolidation XP
      earnedXp = CONFIG.GAMIFICATION.XP_PER_INCORRECT;
      earnedCoins = 0;
    }

    // 7. Update User Profile statistics in database
    const { user: updatedUser, levelUp, newLevel } = this.userService.addExperienceAndCoins(
      userId,
      earnedXp,
      earnedCoins,
      true // Mark as valid quiz answer transaction to count daily tally
    );

    // 8. Log Submission Entity
    const submissionId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const submission: Submission = {
      id: submissionId,
      user_id: userId,
      question_id: questionId,
      selected_option: selectedOption,
      is_correct: isCorrect,
      earned: earnedCoins,
      answered_at: new Date().toISOString()
    };
    
    this.submissionRepo.create(submission);

    // 9. Formulate dynamic responsive UI animation triggers
    const animation_state = {
      sparkles: isCorrect,
      streak_glow: isCorrect && updatedUser.streak >= 3,
      level_glow: levelUp
    };

    return {
      is_correct: isCorrect,
      correct_option: question.correct_option,
      selected_option: selectedOption,
      earned_coins: earnedCoins,
      earned_xp: earnedXp,
      streak: updatedUser.streak,
      daily_answer_count: updatedUser.daily_answer_count,
      daily_limit: updatedUser.daily_limit,
      level_up: levelUp,
      new_level: updatedUser.level,
      new_xp: updatedUser.xp,
      new_balance: updatedUser.balance,
      animation_state
    };
  }
}
export const quizService = new QuizService();
