/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Centered Application Configurations
 * This module governs all environmental variables, feature flags, and standard constants.
 */
export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Telegram Bot Credentials and Validation flags
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  // Disable initData validation during development or if no token is configured
  SKIP_TELEGRAM_AUTH: process.env.SKIP_TELEGRAM_AUTH !== 'false',

  // Gamification & Progression Curve Parameters
  GAMIFICATION: {
    DAILY_LIMIT: 20,              // Max questions a user can submit in a single 24-hour cycle
    XP_PER_CORRECT: 15,          // Base XP rewarded per correct option
    XP_PER_INCORRECT: 3,         // Consolidation XP for answering but getting it wrong
    BASE_COIN_REWARD: 10,        // Base coin reward per correct option
    STREAK_MULTIPLIER: 0.1,      // 10% bonus coins per streak day, up to max streak cap
    MAX_STREAK_CAP: 7,           // Cap at a max 7-day streak multiplier
    STREAK_RESET_HOURS: 48,      // Reset streak if user hasn't answered in this many hours
  },

  // Gemini API Configuration
  GEMINI: {
    API_KEY: process.env.GEMINI_API_KEY || '',
    MODEL: 'gemini-3.5-flash',
  },

  // Filesystem persistence paths
  DATABASE: {
    DATA_DIR: './data',
    DB_FILE_PATH: './data/brainbet_db.json',
  }
};

/**
 * Calculates the required XP for a given level using an exponential progression scale.
 * Formula: Required XP = base * (level ^ exponent)
 * level 1 -> 2: 100 XP
 * level 2 -> 3: 220 XP
 * level 3 -> 4: 380 XP
 * level 4 -> 5: 580 XP
 */
import { getRequiredXpForLevel } from '../../src/utils/xp.js';

export { getRequiredXpForLevel };
