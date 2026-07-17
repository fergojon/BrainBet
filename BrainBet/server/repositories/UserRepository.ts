/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseEngine } from '../database/engine.js';
import { User } from '../models/types.js';

export interface IUserRepository {
  getByTelegramId(telegramId: string): User | null;
  create(user: User): User;
  update(user: User): User;
  getLeaderboard(limit: number): User[];
}

export class UserRepository implements IUserRepository {
  constructor(private dbEngine = DatabaseEngine.getInstance()) {}

  /**
   * Retrieves a User by their unique Telegram Identifier
   */
  public getByTelegramId(telegramId: string): User | null {
    const data = this.dbEngine.read();
    const user = data.users.find(u => u.telegram_id === telegramId);
    return user ? { ...user } : null; // Return clone to prevent side-channel mutations
  }

  /**
   * Registers a new User into the persistent collections
   */
  public create(user: User): User {
    return this.dbEngine.transaction<User>((dbState) => {
      // Prevent duplication anomalies
      const index = dbState.users.findIndex(u => u.telegram_id === user.telegram_id);
      if (index !== -1) {
        throw new Error(`User with telegram_id ${user.telegram_id} already exists.`);
      }

      const userToSave = {
        ...user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      dbState.users.push(userToSave);
      
      return {
        nextDb: dbState,
        result: { ...userToSave }
      };
    });
  }

  /**
   * Updates an existing User's statistical properties
   */
  public update(user: User): User {
    return this.dbEngine.transaction<User>((dbState) => {
      const index = dbState.users.findIndex(u => u.telegram_id === user.telegram_id);
      if (index === -1) {
        throw new Error(`User with telegram_id ${user.telegram_id} not found.`);
      }

      const updatedUser = {
        ...user,
        updated_at: new Date().toISOString()
      };

      dbState.users[index] = updatedUser;

      return {
        nextDb: dbState,
        result: { ...updatedUser }
      };
    });
  }

  /**
   * Aggregates and returns the leaderboard based on XP descendingly.
   */
  public getLeaderboard(limit = 100): User[] {
    const data = this.dbEngine.read();
    // Sort users descendingly by level, then xp, then balance
    return [...data.users]
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        if (b.xp !== a.xp) return b.xp - a.xp;
        return b.balance - a.balance;
      })
      .slice(0, limit)
      .map(u => ({ ...u }));
  }
}
