import { DatabaseEngine } from '../database/engine.js';
import { Tournament, TournamentParticipantProgress, Question, User } from '../models/types.js';
import { UserRepository } from '../repositories/UserRepository.js';

export class TournamentService {
  constructor(
    private dbEngine = DatabaseEngine.getInstance(),
    private userRepo = new UserRepository()
  ) {}

  /**
   * Fetches all tournaments from database
   */
  public getAll(): Tournament[] {
    const data = this.dbEngine.read();
    return data.tournaments || [];
  }

  /**
   * Fetches active tournaments
   */
  public getActive(): Tournament[] {
    return this.getAll().filter(t => t.is_active);
  }

  /**
   * Fetches tournament by ID
   */
  public getById(id: string): Tournament | null {
    const list = this.getAll();
    const found = list.find(t => t.id === id);
    return found ? { ...found } : null;
  }

  /**
   * Creates a new tournament (Admin only)
   */
  public createTournament(data: {
    title: string;
    description: string;
    entry_fee: number;
    prize_pool: number;
    questions: Omit<Question, 'id' | 'created_at'>[];
  }): Tournament {
    return this.dbEngine.transaction<Tournament>((dbState) => {
      if (!dbState.tournaments) {
        dbState.tournaments = [];
      }

      // Generate actual Question structures with IDs
      const compiledQuestions: Question[] = data.questions.map((q, idx) => ({
        id: `tq_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        difficulty: q.difficulty || 'medium',
        category: q.category || 'Tournament',
        reward: q.reward || 0,
        created_at: new Date().toISOString()
      }));

      const newTournament: Tournament = {
        id: `trn_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        title: data.title,
        description: data.description,
        entry_fee: Number(data.entry_fee) || 0,
        prize_pool: Number(data.prize_pool) || 0,
        questions: compiledQuestions,
        participants: [],
        leaderboard: [],
        is_active: true,
        created_at: new Date().toISOString()
      };

      dbState.tournaments.push(newTournament);
      return {
        nextDb: dbState,
        result: newTournament
      };
    });
  }

  /**
   * Deletes a tournament (Admin only)
   */
  public deleteTournament(id: string): boolean {
    return this.dbEngine.transaction<boolean>((dbState) => {
      if (!dbState.tournaments) return { nextDb: dbState, result: false };
      const index = dbState.tournaments.findIndex(t => t.id === id);
      if (index === -1) return { nextDb: dbState, result: false };

      dbState.tournaments.splice(index, 1);
      return {
        nextDb: dbState,
        result: true
      };
    });
  }

  /**
   * Toggles tournament active status (Admin only)
   */
  public toggleStatus(id: string): Tournament {
    return this.dbEngine.transaction<Tournament>((dbState) => {
      if (!dbState.tournaments) {
        throw new Error('Tournaments table not found.');
      }
      const found = dbState.tournaments.find(t => t.id === id);
      if (!found) {
        throw new Error('Tournament topilmadi.');
      }
      found.is_active = !found.is_active;
      return {
        nextDb: dbState,
        result: { ...found }
      };
    });
  }

  /**
   * Registers/Joins user to a tournament
   */
  public joinTournament(userId: string, tournamentId: string): { tournament: Tournament; user: User } {
    return this.dbEngine.transaction<{ tournament: Tournament; user: User }>((dbState) => {
      // 1. Find User
      const userIndex = dbState.users.findIndex(u => u.telegram_id === userId);
      if (userIndex === -1) {
        throw new Error('Foydalanuvchi topilmadi.');
      }
      const user = dbState.users[userIndex];

      if (user.is_banned) {
        throw new Error('Siz bloklangansiz. Turnirlarda qatnasha olmaysiz.');
      }

      // 2. Find Tournament
      if (!dbState.tournaments) {
        dbState.tournaments = [];
      }
      const tourIndex = dbState.tournaments.findIndex(t => t.id === tournamentId);
      if (tourIndex === -1) {
        throw new Error('Turnir topilmadi.');
      }
      const tournament = dbState.tournaments[tourIndex];

      if (!tournament.is_active) {
        throw new Error('Ushbu turnir yakunlangan yoki faol emas.');
      }

      // Check if already participant
      if (tournament.participants.includes(userId)) {
        return {
          nextDb: dbState,
          result: { tournament, user }
        };
      }

      // Calculate entry fee: FREE for Premium members, entry_fee for others
      const fee = user.is_premium ? 0 : tournament.entry_fee;

      if (user.balance < fee) {
        throw new Error(`Mablag' yetarli emas. Turnirga kirish narxi: ${fee.toLocaleString()} Coin.`);
      }

      // Deduct coins if there is a fee
      if (fee > 0) {
        user.balance -= fee;
      }

      // Register participant
      tournament.participants.push(userId);
      
      // Initialize progress
      const progress: TournamentParticipantProgress = {
        user_id: userId,
        username: user.username || `user_${userId}`,
        correct_count: 0,
        completed_questions_count: 0,
        total_time_ms: 0,
        started_at: null, // will be initialized upon first answer submission or clicking "start"
        completed_at: null,
        answers: []
      };

      tournament.leaderboard.push(progress);

      return {
        nextDb: dbState,
        result: {
          tournament: { ...tournament },
          user: { ...user }
        }
      };
    });
  }

  /**
   * Starts timing for a user in a tournament
   */
  public startTournamentTimer(userId: string, tournamentId: string): Tournament {
    return this.dbEngine.transaction<Tournament>((dbState) => {
      if (!dbState.tournaments) throw new Error('Turnirlar topilmadi.');
      const tour = dbState.tournaments.find(t => t.id === tournamentId);
      if (!tour) throw new Error('Turnir topilmadi.');

      const progress = tour.leaderboard.find(l => l.user_id === userId);
      if (!progress) {
        throw new Error('Siz ushbu turnirda ro\'yxatdan o\'tmagansiz.');
      }

      if (!progress.started_at) {
        progress.started_at = new Date().toISOString();
      }

      return {
        nextDb: dbState,
        result: { ...tour }
      };
    });
  }

  /**
   * Submits an answer to a tournament question
   */
  public submitAnswer(
    userId: string,
    tournamentId: string,
    questionId: string,
    selectedOption: 'A' | 'B' | 'C' | 'D'
  ): { tournament: Tournament; user: User; evaluation: { is_correct: boolean; correct_option: string; earned_coins: number; earned_xp: number; is_finished: boolean } } {
    return this.dbEngine.transaction<{ tournament: Tournament; user: User; evaluation: any }>((dbState) => {
      // 1. Fetch user
      const userIndex = dbState.users.findIndex(u => u.telegram_id === userId);
      if (userIndex === -1) throw new Error('Foydalanuvchi topilmadi.');
      const user = dbState.users[userIndex];

      if (user.is_banned) {
        throw new Error('Bloklangan foydalanuvchilar javob bera olmaydi.');
      }

      // 2. Fetch tournament
      if (!dbState.tournaments) dbState.tournaments = [];
      const tourIndex = dbState.tournaments.findIndex(t => t.id === tournamentId);
      if (tourIndex === -1) throw new Error('Turnir topilmadi.');
      const tournament = dbState.tournaments[tourIndex];

      if (!tournament.is_active) {
        throw new Error('Ushbu turnir faol emas.');
      }

      // 3. Find progress
      const progress = tournament.leaderboard.find(p => p.user_id === userId);
      if (!progress) {
        throw new Error('Ushbu turnirda ro\'yxatdan o\'tmagansiz.');
      }

      if (progress.completed_at) {
        throw new Error('Siz ushbu turnirni allaqachon yakunlagansiz.');
      }

      // Initialize started_at if not set
      if (!progress.started_at) {
        progress.started_at = new Date().toISOString();
      }

      // Check speed limit (anti-cheat: 1.2s for tournament questions to allow slightly faster action but guard bots)
      const lastAnswer = progress.answers[progress.answers.length - 1];
      if (lastAnswer) {
        const lastTime = new Date(lastAnswer.answered_at).getTime();
        const nowTime = Date.now();
        const diff = (nowTime - lastTime) / 1000;
        if (diff < 1.2) {
          user.is_banned = true;
          user.ban_reason = 'Avtomatik ban: Turnirda tezkor bot/cheat faolligi aniqlandi';
          throw new Error('Siz turnirda bot orqali tezkor javob bergandek shubhalanib blocklandingiz!');
        }
      }

      // Find question
      const question = tournament.questions.find(q => q.id === questionId);
      if (!question) {
        throw new Error('Turnir savoli topilmadi.');
      }

      // Check if already answered
      if (progress.answers.some(a => a.question_id === questionId)) {
        throw new Error('Ushbu savolga allaqachon javob bergansiz.');
      }

      // Evaluate
      const isCorrect = question.correct_option === selectedOption;
      const nowStr = new Date().toISOString();

      progress.answers.push({
        question_id: questionId,
        selected_option: selectedOption,
        is_correct: isCorrect,
        answered_at: nowStr
      });

      progress.completed_questions_count = progress.answers.length;
      if (isCorrect) {
        progress.correct_count += 1;
      }

      let earnedCoins = 0;
      let earnedXp = isCorrect ? 40 : 10; // XP per question inside tournament

      // Is tournament fully completed for this user?
      const totalQuestions = tournament.questions.length;
      const isFinished = progress.completed_questions_count === totalQuestions;

      if (isFinished) {
        progress.completed_at = nowStr;
        // Calculate total time
        const startTime = progress.started_at ? new Date(progress.started_at).getTime() : Date.now();
        const endTime = new Date(nowStr).getTime();
        progress.total_time_ms = Math.max(100, endTime - startTime);

        // Payout evaluation!
        // User gets prize_pool proportionally. E.g. prize_pool * (correct_count / totalQuestions)
        const basePayout = Math.floor(tournament.prize_pool * (progress.correct_count / totalQuestions));
        earnedCoins = basePayout;

        // Premium Benefits:
        // 1) 20% bonus coin payout in Tournaments!
        // 2) Double XP bonus for completing tournament
        let premiumBonus = 0;
        if (user.is_premium) {
          premiumBonus = Math.floor(basePayout * 0.20);
          earnedCoins += premiumBonus;
          earnedXp += 250; // extra completion XP bonus for premium members
        } else {
          earnedXp += 100; // completion XP bonus for normal members
        }

        user.balance += earnedCoins;
        user.xp += earnedXp;
      } else {
        // give tiny instant feedback coin if correct (e.g. 50 coins)
        if (isCorrect) {
          const baseInstant = 50;
          earnedCoins = user.is_premium ? baseInstant * 2 : baseInstant; // Premium gets double instant coins
          user.balance += earnedCoins;
          user.xp += earnedXp;
        } else {
          user.xp += earnedXp;
        }
      }

      // Recalculate level
      // Level formula: level = Math.floor(Math.sqrt(xp / 100)) + 1
      user.level = Math.floor(Math.sqrt(user.xp / 100)) + 1;
      user.updated_at = nowStr;

      // Sort tournament leaderboard by correct_count desc, then total_time_ms asc
      tournament.leaderboard.sort((a, b) => {
        if (b.correct_count !== a.correct_count) {
          return b.correct_count - a.correct_count;
        }
        // both completed? compare speed
        if (a.completed_at && b.completed_at) {
          return a.total_time_ms - b.total_time_ms;
        }
        // completed comes first
        if (a.completed_at && !b.completed_at) return -1;
        if (!a.completed_at && b.completed_at) return 1;
        return b.completed_questions_count - a.completed_questions_count;
      });

      return {
        nextDb: dbState,
        result: {
          tournament: { ...tournament },
          user: { ...user },
          evaluation: {
            is_correct: isCorrect,
            correct_option: question.correct_option,
            earned_coins: earnedCoins,
            earned_xp: earnedXp,
            is_finished: isFinished
          }
        }
      };
    });
  }
}

export const tournamentService = new TournamentService();
