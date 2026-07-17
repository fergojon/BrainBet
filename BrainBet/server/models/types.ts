/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Domain entity representing a BrainBet User
 */
export interface User {
  telegram_id: string;          // Extracted from Telegram WebApp initData
  username: string;             // User's telegram username or display name
  balance: number;              // Current coin balance
  xp: number;                   // Accumulated Lifetime Experience Points
  level: number;                // Current level calculated from XP
  daily_answer_count: number;   // Number of questions answered in the current daily period
  daily_limit: number;          // Maximum questions user is allowed to answer per day
  streak: number;               // Uninterrupted daily activity streak
  last_answered_at: string | null; // ISO Timestamp of the last quiz submission
  created_at: string;           // ISO Timestamp of registration
  updated_at: string;           // ISO Timestamp of last modification
  is_premium?: boolean;         // Premium status flag
  last_premium_claim_at?: string | null; // ISO timestamp of the last premium daily coin claim
  is_banned?: boolean;          // Banned status flag
  ban_reason?: string;          // Reason for ban
}

/**
 * Domain entity representing a Quiz Question
 */
export interface Question {
  id: string;                   // Unique ID (UUID or generated hash)
  question: string;             // The question statement
  option_a: string;             // Option A
  option_b: string;             // Option B
  option_c: string;             // Option C
  option_d: string;             // Option D
  correct_option: 'A' | 'B' | 'C' | 'D'; // The index of the correct answer
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;             // e.g. "Crypto", "Cosmos", "AI History"
  reward: number;               // Standard Coin Reward for solving this question
  created_at: string;           // ISO Timestamp of addition
}

/**
 * Domain entity representing a User Submission
 */
export interface Submission {
  id: string;                   // Submission UUID
  user_id: string;              // Foreign Key matching User.telegram_id
  question_id: string;          // Foreign Key matching Question.id
  selected_option: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;          // Evaluation result
  earned: number;               // Coins earned in this specific action
  answered_at: string;          // ISO Timestamp of answering
}

/**
 * Domain entity representing a Withdrawal Request
 */
export interface Withdrawal {
  id: string;
  user_id: string;
  username: string;
  card_number: string;
  card_holder: string;
  amount_coins: number;
  amount_som: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at: string | null;
}

export interface TournamentParticipantProgress {
  user_id: string;
  username: string;
  correct_count: number;
  completed_questions_count: number;
  total_time_ms: number;
  started_at: string | null; // ISO timestamp when started answering, or when joined
  completed_at: string | null; // ISO timestamp when finished, null if not finished
  answers: {
    question_id: string;
    selected_option: 'A' | 'B' | 'C' | 'D';
    is_correct: boolean;
    answered_at: string;
  }[];
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  entry_fee: number; // in Coins (0 for Premium users)
  prize_pool: number; // total reward or reward pool distributed/earned
  questions: Question[]; // Custom compiled list of questions
  participants: string[]; // telegram_ids of users who entered
  leaderboard: TournamentParticipantProgress[];
  is_active: boolean;
  created_at: string;
}

/**
 * Interface representing the database file structure for JSON DB
 */
export interface DatabaseSchema {
  users: User[];
  questions: Question[];
  submissions: Submission[];
  withdrawals: Withdrawal[];
  tournaments?: Tournament[];
  settings?: {
    withdrawals_enabled: boolean;
  };
}
