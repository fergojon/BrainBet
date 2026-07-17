/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { CONFIG } from '../core/config.js';

// Extend Express Request interface to hold authenticated Telegram session
declare global {
  namespace Express {
    interface Request {
      telegramUser?: {
        id: string;
        username: string;
        first_name?: string;
        last_name?: string;
        language_code?: string;
      };
    }
  }
}

/**
 * Validates Telegram WebApp initData cryptographic integrity.
 * Verification protocol:
 * 1. Parse the query-string format of initData.
 * 2. Pull 'hash' property and remove it from validation pool.
 * 3. Order remaining parameters alphabetically and join with '\n'.
 * 4. Generate secret key using HMAC-SHA256 on bot token using 'WebAppData' key.
 * 5. Calculate HMAC-SHA256 on joined string and compare hex digest to 'hash'.
 */
export function validateTelegramInitData(initData: string): { isValid: boolean; user: any } {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      return { isValid: false, user: null };
    }

    // Extract user JSON payload early for extraction
    const rawUser = params.get('user');
    const user = rawUser ? JSON.parse(rawUser) : null;

    // Cryptographic validation bypass if token is omitted or skipped in config
    if (CONFIG.SKIP_TELEGRAM_AUTH || !CONFIG.TELEGRAM_BOT_TOKEN) {
      return { isValid: true, user: user || { id: '999999', username: 'ai_studio_tester' } };
    }

    // Build the data check string
    const keys = Array.from(params.keys()).filter(k => k !== 'hash').sort();
    const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join('\n');

    // Generate SHA-256 HMAC Secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(CONFIG.TELEGRAM_BOT_TOKEN)
      .digest();

    // Verify hex signature match
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const isValid = calculatedHash === hash;
    return { isValid, user };

  } catch (error) {
    console.error('Error verifying Telegram signature:', error);
    return { isValid: false, user: null };
  }
}

/**
 * Express Authentication Middleware
 * Validates 'x-telegram-init-data' headers on incoming endpoints.
 */
export function telegramAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const initDataHeader = req.headers['x-telegram-init-data'] as string;

  if (!initDataHeader) {
    // If auth is completely skipped, let's inject a static test profile for testing
    if (CONFIG.SKIP_TELEGRAM_AUTH) {
      req.telegramUser = { id: '12345678', username: 'brainbet_architect' };
      return next();
    }
    res.status(401).json({ error: 'Unauthorized: Missing Telegram initialization session.' });
    return;
  }

  const { isValid, user } = validateTelegramInitData(initDataHeader);

  if (!isValid || !user) {
    res.status(403).json({ error: 'Forbidden: Invalid cryptographic signature.' });
    return;
  }

  // Inject parsed telegram user payload into current request pipeline
  req.telegramUser = {
    id: String(user.id),
    username: user.username || `User_${user.id}`,
    first_name: user.first_name,
    last_name: user.last_name,
    language_code: user.language_code
  };

  next();
}
