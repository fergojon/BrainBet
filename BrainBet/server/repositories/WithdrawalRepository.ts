/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseEngine } from '../database/engine.js';
import { Withdrawal } from '../models/types.js';

export interface IWithdrawalRepository {
  create(withdrawal: Withdrawal): Withdrawal;
  update(withdrawal: Withdrawal): Withdrawal;
  getAll(): Withdrawal[];
  getById(id: string): Withdrawal | null;
  getByUserId(userId: string): Withdrawal[];
}

export class WithdrawalRepository implements IWithdrawalRepository {
  constructor(private dbEngine = DatabaseEngine.getInstance()) {}

  /**
   * Creates a new withdrawal request
   */
  public create(withdrawal: Withdrawal): Withdrawal {
    return this.dbEngine.transaction<Withdrawal>((dbState) => {
      if (!dbState.withdrawals) {
        dbState.withdrawals = [];
      }

      const newWithdrawal = {
        ...withdrawal,
        created_at: withdrawal.created_at || new Date().toISOString()
      };

      dbState.withdrawals.push(newWithdrawal);

      return {
        nextDb: dbState,
        result: { ...newWithdrawal }
      };
    });
  }

  /**
   * Updates an existing withdrawal request
   */
  public update(withdrawal: Withdrawal): Withdrawal {
    return this.dbEngine.transaction<Withdrawal>((dbState) => {
      if (!dbState.withdrawals) {
        dbState.withdrawals = [];
      }

      const index = dbState.withdrawals.findIndex(w => w.id === withdrawal.id);
      if (index === -1) {
        throw new Error(`Withdrawal request with id ${withdrawal.id} not found.`);
      }

      const updatedWithdrawal = {
        ...withdrawal,
        processed_at: new Date().toISOString()
      };

      dbState.withdrawals[index] = updatedWithdrawal;

      return {
        nextDb: dbState,
        result: { ...updatedWithdrawal }
      };
    });
  }

  /**
   * Retrieves all withdrawal requests
   */
  public getAll(): Withdrawal[] {
    const data = this.dbEngine.read();
    return (data.withdrawals || []).map(w => ({ ...w }));
  }

  /**
   * Retrieves a withdrawal request by its ID
   */
  public getById(id: string): Withdrawal | null {
    const data = this.dbEngine.read();
    const w = (data.withdrawals || []).find(x => x.id === id);
    return w ? { ...w } : null;
  }

  /**
   * Retrieves withdrawal requests by user ID
   */
  public getByUserId(userId: string): Withdrawal[] {
    const data = this.dbEngine.read();
    return (data.withdrawals || [])
      .filter(w => w.user_id === userId)
      .map(w => ({ ...w }));
  }
}
