/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QuestionRepository } from '../repositories/QuestionRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { WithdrawalRepository } from '../repositories/WithdrawalRepository.js';
import { Question, User, Withdrawal } from '../models/types.js';
import { DatabaseEngine } from '../database/engine.js';

export class AdminService {
  constructor(
    private questionRepo = new QuestionRepository(),
    private userRepo = new UserRepository(),
    private withdrawalRepo = new WithdrawalRepository(),
    private dbEngine = DatabaseEngine.getInstance()
  ) {}

  // --- QUESTION MANAGEMENT ---

  public createQuestion(questionData: Omit<Question, 'created_at'>): Question {
    const id = questionData.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const question: Question = {
      ...questionData,
      id,
      created_at: new Date().toISOString()
    };
    return this.questionRepo.create(question);
  }

  public updateQuestion(id: string, questionData: Partial<Question>): Question {
    const existing = this.questionRepo.getById(id);
    if (!existing) {
      throw new Error(`Question ${id} not found`);
    }
    const updated: Question = {
      ...existing,
      ...questionData,
      id // preserve ID
    };
    return this.questionRepo.update(updated);
  }

  public deleteQuestion(id: string): boolean {
    return this.questionRepo.delete(id);
  }

  public getAllQuestions(): Question[] {
    return this.questionRepo.getAll();
  }

  // --- USER MANAGEMENT ---

  public getAllUsers(): User[] {
    // Simply fetch all users by reading leaderboard with a massive limit
    return this.userRepo.getLeaderboard(10000);
  }

  // --- WITHDRAWAL MANAGEMENT ---

  public requestWithdrawal(
    telegramId: string,
    username: string,
    cardNumber: string,
    cardHolder: string,
    amountCoins: number
  ): Withdrawal {
    const user = this.userRepo.getByTelegramId(telegramId);
    if (!user) {
      throw new Error('Foydalanuvchi topilmadi.');
    }

    if (amountCoins <= 0) {
      throw new Error('Minimal yechish summasi 1 coindan boshlanadi.');
    }

    if (user.balance < amountCoins) {
      throw new Error('Hamyoningizda yetarli mablag\' mavjud emas.');
    }

    // Enforce 3-month (90 days) frequency limit (except for rejected ones)
    const userWithdrawals = this.withdrawalRepo.getByUserId(telegramId);
    const lastThreeMonths = 90 * 24 * 60 * 60 * 1000; // 90 days in ms
    const now = Date.now();

    const recentWithdrawal = userWithdrawals.find(w => {
      if (w.status === 'rejected') return false;
      const createdTime = new Date(w.created_at).getTime();
      return (now - createdTime) < lastThreeMonths;
    });

    if (recentWithdrawal) {
      const elapsed = now - new Date(recentWithdrawal.created_at).getTime();
      const remainingMs = lastThreeMonths - elapsed;
      const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
      throw new Error(`Mablag' yechish 3 oyda faqat 1 marta mumkin! Keyingi safar yechishga ${remainingDays} kun qoldi.`);
    }

    // 1000 coin = 1000 so'm (1:1 conversion rate)
    const amountSom = amountCoins;

    // Deduct coins from user balance
    user.balance -= amountCoins;
    this.userRepo.update(user);

    const withdrawal: Withdrawal = {
      id: `wth-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user_id: telegramId,
      username: username || user.username,
      card_number: cardNumber,
      card_holder: cardHolder,
      amount_coins: amountCoins,
      amount_som: amountSom,
      status: 'pending',
      created_at: new Date().toISOString(),
      processed_at: null
    };

    return this.withdrawalRepo.create(withdrawal);
  }

  public getWithdrawalsForUser(telegramId: string): Withdrawal[] {
    return this.withdrawalRepo.getByUserId(telegramId);
  }

  public getAllWithdrawals(): Withdrawal[] {
    return this.withdrawalRepo.getAll();
  }

  public updateWithdrawalStatus(id: string, status: 'approved' | 'rejected'): Withdrawal {
    const w = this.withdrawalRepo.getById(id);
    if (!w) {
      throw new Error('Yechib olish so\'rovi topilmadi.');
    }

    if (w.status !== 'pending') {
      throw new Error('Ushbu so\'rov allaqachon ko\'rib chiqilgan.');
    }

    w.status = status;
    w.processed_at = new Date().toISOString();

    const updated = this.withdrawalRepo.update(w);

    // If rejected, refund the coins back to user
    if (status === 'rejected') {
      const user = this.userRepo.getByTelegramId(w.user_id);
      if (user) {
        user.balance += w.amount_coins;
        this.userRepo.update(user);
      }
    }

    return updated;
  }

  // --- SETTINGS AND BAN OPERATIONS ---

  public getSettings(): { withdrawals_enabled: boolean } {
    const dbState = this.dbEngine.read();
    return {
      withdrawals_enabled: dbState.settings?.withdrawals_enabled !== false
    };
  }

  public updateSettings(withdrawals_enabled: boolean): { withdrawals_enabled: boolean } {
    return this.dbEngine.transaction<{ withdrawals_enabled: boolean }>((dbState) => {
      if (!dbState.settings) {
        dbState.settings = { withdrawals_enabled: true };
      }
      dbState.settings.withdrawals_enabled = withdrawals_enabled;
      return {
        nextDb: dbState,
        result: { withdrawals_enabled }
      };
    });
  }

  public banUser(telegramId: string, reason: string): User {
    const user = this.userRepo.getByTelegramId(telegramId);
    if (!user) {
      throw new Error('Foydalanuvchi topilmadi.');
    }
    user.is_banned = true;
    user.ban_reason = reason || 'Qoidabuzarlik sababli bloklangan';
    return this.userRepo.update(user);
  }

  public unbanUser(telegramId: string): User {
    const user = this.userRepo.getByTelegramId(telegramId);
    if (!user) {
      throw new Error('Foydalanuvchi topilmadi.');
    }
    user.is_banned = false;
    user.ban_reason = undefined;
    return this.userRepo.update(user);
  }
}

export const adminService = new AdminService();
