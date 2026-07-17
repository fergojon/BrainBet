/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import { quizService } from '../services/QuizService.js';
import { userService } from '../services/UserService.js';
import { aiService } from '../services/AIService.js';
import { adminService } from '../services/AdminService.js';
import { tournamentService } from '../services/TournamentService.js';
import { validateSubmissionPayload, validateAIGenerationPayload } from '../schemas/validation.js';
import { telegramAuthMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * Helper to determine if a Telegram user is authorized as an Admin.
 * Supports environment variable ADMIN_TELEGRAM_IDS (comma-separated list of IDs)
 * and ADMIN_USERNAMES (comma-separated list of usernames).
 */
export function isAdmin(telegramId: string | number, username?: string): boolean {
  const defaultAdminIds = ['711824249'];
  const envAdminIds = process.env.ADMIN_TELEGRAM_IDS 
    ? process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => id.trim()) 
    : [];
  
  const allAdminIds = [...defaultAdminIds, ...envAdminIds];
  
  const defaultAdminUsernames = ['brainbet_architect', 'admin', 'fgquizzes'];
  const envAdminUsernames = process.env.ADMIN_USERNAMES
    ? process.env.ADMIN_USERNAMES.split(',').map(u => u.trim().toLowerCase())
    : [];
  const allAdminUsernames = [...defaultAdminUsernames, ...envAdminUsernames];

  const idStr = String(telegramId);
  if (allAdminIds.includes(idStr)) {
    return true;
  }
  
  if (username && allAdminUsernames.includes(username.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * GET /api/questions
 * Pulls random unanswered questions for the authenticated user.
 * Optional query parameters:
 *  - difficulty: 'easy' | 'medium' | 'hard'
 *  - limit: number
 */
router.get('/questions', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const difficulty = req.query.difficulty as 'easy' | 'medium' | 'hard' | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
    const category = req.query.category as string | undefined;

    const questions = quizService.getQuestionsForUser(telegramId, difficulty, limit, category);
    
    res.json({
      status: 'success',
      data: {
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          difficulty: q.difficulty,
          category: q.category,
          reward: q.reward
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/submit
 * Submits the selected answer for evaluation, increments rewards, and updates streak stats.
 */
router.post('/submit', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    
    const { isValid, error, data } = validateSubmissionPayload(req.body);
    if (!isValid || !data) {
      res.status(400).json({ error: error || 'Invalid parameters.' });
      return;
    }

    const result = quizService.submitAnswer(
      telegramId,
      data.question_id,
      data.selected_option
    );

    res.json({
      status: 'success',
      data: result
    });
  } catch (error: any) {
    // If double submission or limit error, return a clean 400 Bad Request
    if (error instanceof Error && (
      error.message.includes('already answered') || 
      error.message.includes('Limit reached') ||
      error.message.includes('Double-submission')
    )) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

/**
 * GET /api/user/:telegram_id
 * Returns current statistics, balance, level, and active streak progress.
 * Real-time computes their leaderboard position on the global stage.
 */
router.get('/user/:telegram_id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { telegram_id } = req.params;
    const username = (req.query.username as string) || `Telegram_User`;

    if (!telegram_id) {
      res.status(400).json({ error: 'Parameter "telegram_id" is required.' });
      return;
    }

    // Resolve or bootstrap user profile
    const user = userService.getOrCreateUser(telegram_id, username);

    // Compute actual global leaderboard placement
    const leaderboard = userService.getLeaderboard(1000);
    const positionIndex = leaderboard.findIndex(u => u.telegram_id === telegram_id);
    const leaderboardPosition = positionIndex !== -1 ? positionIndex + 1 : leaderboard.length + 1;

    res.json({
      status: 'success',
      data: {
        profile: {
          telegram_id: user.telegram_id,
          username: user.username,
          created_at: user.created_at,
          is_admin: isAdmin(user.telegram_id, user.username),
          is_premium: user.is_premium,
          is_banned: user.is_banned,
          ban_reason: user.ban_reason
        },
        balance: user.balance,
        xp: user.xp,
        level: user.level,
        daily_limit: user.daily_limit,
        answered_today: user.daily_answer_count,
        streak: user.streak,
        last_answered_at: user.last_answered_at,
        progress: {
          answered_today: user.daily_answer_count,
          daily_limit: user.daily_limit
        },
        leaderboard_position: leaderboardPosition
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/leaderboard
 * Returns the highest ranking users on the platform.
 */
router.get('/leaderboard', (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const ranks = userService.getLeaderboard(limit);
    
    res.json({
      status: 'success',
      data: {
        leaderboard: ranks.map((u, i) => ({
          rank: i + 1,
          telegram_id: u.telegram_id,
          username: u.username,
          level: u.level,
          xp: u.xp,
          balance: u.balance,
          streak: u.streak
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/generate
 * Dynamic endpoint to create custom trivia questions on-the-fly using Gemini API
 */
router.post('/ai/generate', telegramAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isValid, error, data } = validateAIGenerationPayload(req.body);
    if (!isValid || !data) {
      res.status(400).json({ error: error || 'Invalid parameters.' });
      return;
    }

    const questions = await aiService.generateQuestions(
      data.category,
      data.difficulty,
      data.count
    );

    res.json({
      status: 'success',
      message: `Successfully generated ${questions.length} questions on topic: "${data.category}" using Gemini AI.`,
      data: {
        questions: questions.map(q => ({
          id: q.id,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          difficulty: q.difficulty,
          category: q.category,
          reward: q.reward
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI generation failed.' });
  }
});

/**
 * POST /api/wallet/withdraw
 * Submits a new withdrawal request for the user in So'm (UZS)
 */
router.post('/wallet/withdraw', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username || '';

    // Check if banned
    const user = userService.getOrCreateUser(telegramId, username);
    if (user.is_banned) {
      res.status(403).json({ error: `Siz bot yoki cheatdan foydalanganlikda shubhalanib blocklandingiz! Sabab: ${user.ban_reason || 'Noma\'lum'}` });
      return;
    }

    // Check if withdrawals are open
    const settings = adminService.getSettings();
    if (!settings.withdrawals_enabled) {
      res.status(400).json({ error: 'Mablag\' yechib olish vaqtinchalik yopiq. Admin e\'lonini kuting (Yechish 3 oyda bir marta ochiladi).' });
      return;
    }

    const { card_number, card_holder, amount_coins } = req.body;

    if (!card_number || !card_holder || !amount_coins) {
      res.status(400).json({ error: 'Karta raqami, karta egasi ismi va tanga miqdori talab qilinadi.' });
      return;
    }

    const coins = parseInt(amount_coins, 10);
    if (isNaN(coins) || coins <= 0) {
      res.status(400).json({ error: 'Tangalar miqdori noto\'g\'ri kiritilgan.' });
      return;
    }

    const withdrawal = adminService.requestWithdrawal(
      telegramId,
      username,
      card_number,
      card_holder,
      coins
    );

    res.json({
      status: 'success',
      message: 'Yechib olish so\'rovi muvaffaqiyatli qabul qilindi. Operator tasdiqlashini kuting.',
      data: withdrawal
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * GET /api/wallet/withdrawals
 * Fetches current user's withdrawal history
 */
router.get('/wallet/withdrawals', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const withdrawals = adminService.getWithdrawalsForUser(telegramId);
    res.json({
      status: 'success',
      data: withdrawals
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/wallet/settings
 * Fetches global wallet settings (e.g., withdrawals_enabled)
 */
router.get('/wallet/settings', (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = adminService.getSettings();
    res.json({
      status: 'success',
      data: settings
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/wallet/premium
 * Allows a user to purchase BrainBet Premium with 20,000 coins
 */
router.post('/wallet/premium', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const updatedUser = userService.purchasePremium(telegramId);
    res.json({
      status: 'success',
      message: 'Tabriklaymiz! Siz muvaffaqiyatli BrainBet Premium a\'zosiga aylandingiz.',
      data: updatedUser
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * POST /api/wallet/premium-claim
 * Allows a premium user to claim 1,000 daily coins reward
 */
router.post('/wallet/premium-claim', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const { user, claimed } = userService.claimPremiumDailyBonus(telegramId);
    res.json({
      status: 'success',
      message: `Muvaffaqiyatli qabul qilindi! Hamyoningizga ${claimed} Coin qo'shildi.`,
      data: user
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * GET /api/admin/users
 * Returns all users in the system. Accessible by Admin.
 */
router.get('/admin/users', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    
    // Authorization check
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const users = adminService.getAllUsers();
    res.json({
      status: 'success',
      data: users
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/settings
 * Retrieves global database settings
 */
router.get('/admin/settings', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    
    // Authorization check
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const settings = adminService.getSettings();
    res.json({
      status: 'success',
      data: settings
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/settings
 * Updates global database settings (withdrawals_enabled flag)
 */
router.post('/admin/settings', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    
    // Authorization check
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const { withdrawals_enabled } = req.body;
    if (withdrawals_enabled === undefined) {
      res.status(400).json({ error: '"withdrawals_enabled" parametri majburiy.' });
      return;
    }

    const updated = adminService.updateSettings(!!withdrawals_enabled);
    res.json({
      status: 'success',
      message: `Mablag'larni yechib olish muvaffaqiyatli ${withdrawals_enabled ? 'yoqildi (OCHIQ)' : 'o\'chirildi (YOPIQ)'}.`,
      data: updated
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * POST /api/admin/users/:telegram_id/ban
 * Bans a user in the database
 */
router.post('/admin/users/:telegram_id/ban', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    
    // Authorization check
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const targetTelegramId = req.params.telegram_id;
    const { reason } = req.body;

    const updatedUser = adminService.banUser(targetTelegramId, reason);
    res.json({
      status: 'success',
      message: 'Foydalanuvchi muvaffaqiyatli bloklandi.',
      data: updatedUser
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * POST /api/admin/users/:telegram_id/unban
 * Unbans a user in the database
 */
router.post('/admin/users/:telegram_id/unban', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    
    // Authorization check
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const targetTelegramId = req.params.telegram_id;

    const updatedUser = adminService.unbanUser(targetTelegramId);
    res.json({
      status: 'success',
      message: 'Foydalanuvchi blokdan chiqarildi.',
      data: updatedUser
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * GET /api/admin/withdrawals
 * Returns all withdrawal requests. Accessible by Admin.
 */
router.get('/admin/withdrawals', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    
    // Authorization check
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const withdrawals = adminService.getAllWithdrawals();
    res.json({
      status: 'success',
      data: withdrawals
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/withdrawals/:id/status
 * Approves or rejects a withdrawal request. Refund on rejection.
 */
router.post('/admin/withdrawals/:id/status', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    
    // Authorization check
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected'

    if (status !== 'approved' && status !== 'rejected') {
      res.status(400).json({ error: 'Status "approved" yoki "rejected" bo\'lishi shart.' });
      return;
    }

    const updated = adminService.updateWithdrawalStatus(id, status);
    res.json({
      status: 'success',
      message: `So'rov muvaffaqiyatli ${status === 'approved' ? 'tasdiqlandi' : 'rad etildi'}.`,
      data: updated
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * GET /api/admin/questions
 * Returns all quiz questions.
 */
router.get('/admin/questions', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    
    // Authorization check
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const questions = adminService.getAllQuestions();
    res.json({
      status: 'success',
      data: questions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/questions
 * Creates a new quiz question.
 */
router.post('/api/admin/questions', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    
    // Authorization check
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const { question, option_a, option_b, option_c, option_d, correct_option, difficulty, category, reward } = req.body;
    
    if (!question || !option_a || !option_b || !option_c || !option_d || !correct_option || !difficulty || !category || reward === undefined) {
      res.status(400).json({ error: 'Barcha maydonlar to\'ldirilishi shart.' });
      return;
    }

    const created = adminService.createQuestion({
      id: '',
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      difficulty,
      category,
      reward: parseInt(reward, 10)
    });

    res.json({
      status: 'success',
      message: 'Savol muvaffaqiyatli qo\'shildi.',
      data: created
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * PUT /api/admin/questions/:id
 * Updates an existing quiz question.
 */
router.put('/api/admin/questions/:id', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    
    // Authorization check
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const { id } = req.params;
    const updated = adminService.updateQuestion(id, req.body);

    res.json({
      status: 'success',
      message: 'Savol muvaffaqiyatli yangilandi.',
      data: updated
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * DELETE /api/admin/questions/:id
 * Deletes a quiz question.
 */
router.delete('/api/admin/questions/:id', telegramAuthMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    
    // Authorization check
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const { id } = req.params;
    const success = adminService.deleteQuestion(id);

    if (success) {
      res.json({
        status: 'success',
        message: 'Savol muvaffaqiyatli o\'chirildi.'
      });
    } else {
      res.status(404).json({ error: 'Savol topilmadi.' });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * ========================================================
 * TOURNAMENTS (TURNIRLAR) ENDPOINTS
 * ========================================================
 */

/**
 * GET /api/tournaments
 * Lists all active tournaments for users
 */
router.get('/tournaments', telegramAuthMiddleware, (req: Request, res: Response) => {
  try {
    const list = tournamentService.getActive();
    res.json({
      status: 'success',
      data: list
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * GET /api/tournaments/:id
 * Fetches single tournament. Sanitizes correct options if user is still answering.
 */
router.get('/tournaments/:id', telegramAuthMiddleware, (req: Request, res: Response) => {
  try {
    const userId = req.telegramUser!.id;
    const { id } = req.params;
    const t = tournamentService.getById(id);
    if (!t) {
      res.status(404).json({ error: 'Turnir topilmadi.' });
      return;
    }
    
    // Find user progress
    const progress = t.leaderboard.find(p => p.user_id === userId);
    const isFinished = progress ? !!progress.completed_at : false;

    // Sanitize questions to prevent view-source cheat before completion
    const sanitizedQuestions = t.questions.map(q => {
      if (isFinished) return q;
      const { correct_option, ...rest } = q;
      return rest;
    });

    res.json({
      status: 'success',
      data: {
        ...t,
        questions: sanitizedQuestions,
        userProgress: progress || null
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * POST /api/tournaments/:id/join
 * Registers a user to join a tournament
 */
router.post('/tournaments/:id/join', telegramAuthMiddleware, (req: Request, res: Response) => {
  try {
    const userId = req.telegramUser!.id;
    const { id } = req.params;
    const result = tournamentService.joinTournament(userId, id);
    res.json({
      status: 'success',
      message: 'Turnirga muvaffaqiyatli qo\'shildingiz!',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * POST /api/tournaments/:id/start-timer
 * Initializes timing when the user starts answering
 */
router.post('/tournaments/:id/start-timer', telegramAuthMiddleware, (req: Request, res: Response) => {
  try {
    const userId = req.telegramUser!.id;
    const { id } = req.params;
    const result = tournamentService.startTournamentTimer(userId, id);
    res.json({
      status: 'success',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * POST /api/tournaments/:id/submit
 * Submits an answer to a tournament question
 */
router.post('/tournaments/:id/submit', telegramAuthMiddleware, (req: Request, res: Response) => {
  try {
    const userId = req.telegramUser!.id;
    const { id } = req.params;
    const { questionId, selectedOption } = req.body;
    
    if (!questionId || !selectedOption) {
      res.status(400).json({ error: 'questionId va selectedOption kiritilishi shart.' });
      return;
    }

    const result = tournamentService.submitAnswer(userId, id, questionId, selectedOption);
    res.json({
      status: 'success',
      data: result
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * GET /api/admin/tournaments
 * Lists all tournaments for admin
 */
router.get('/admin/tournaments', telegramAuthMiddleware, (req: Request, res: Response) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    res.json({
      status: 'success',
      data: tournamentService.getAll()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * POST /api/admin/tournaments
 * Creates a new tournament
 */
router.post('/admin/tournaments', telegramAuthMiddleware, (req: Request, res: Response) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const { title, description, entry_fee, prize_pool, questions } = req.body;
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: 'Sarlavha va savollar majburiy.' });
      return;
    }

    const t = tournamentService.createTournament({ title, description, entry_fee, prize_pool, questions });
    res.json({
      status: 'success',
      message: 'Turnir muvaffaqiyatli yaratildi!',
      data: t
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * POST /api/admin/tournaments/:id/toggle
 * Toggles tournament active status
 */
router.post('/admin/tournaments/:id/toggle', telegramAuthMiddleware, (req: Request, res: Response) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const { id } = req.params;
    const t = tournamentService.toggleStatus(id);
    res.json({
      status: 'success',
      message: 'Turnir faolligi muvaffaqiyatli o\'zgartirildi.',
      data: t
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

/**
 * DELETE /api/admin/tournaments/:id
 * Deletes a tournament
 */
router.delete('/admin/tournaments/:id', telegramAuthMiddleware, (req: Request, res: Response) => {
  try {
    const telegramId = req.telegramUser!.id;
    const username = req.telegramUser!.username;
    if (!isAdmin(telegramId, username)) {
      res.status(403).json({ error: 'Ruxsat etilmadi. Faqat adminlar uchun.' });
      return;
    }

    const { id } = req.params;
    const success = tournamentService.deleteTournament(id);
    if (success) {
      res.json({
        status: 'success',
        message: 'Turnir muvaffaqiyatli o\'chirildi.'
      });
    } else {
      res.status(404).json({ error: 'Turnir topilmadi.' });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Xatolik yuz berdi.' });
  }
});

export { router as apiRouter };
