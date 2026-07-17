/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseEngine } from '../database/engine.js';
import { Submission } from '../models/types.js';

export interface ISubmissionRepository {
  create(submission: Submission): Submission;
  getByUserAndQuestion(userId: string, questionId: string): Submission | null;
  getUserSubmissionsToday(userId: string): Submission[];
  getUserSubmissionsCount(userId: string): number;
}

export class SubmissionRepository implements ISubmissionRepository {
  constructor(private dbEngine = DatabaseEngine.getInstance()) {}

  /**
   * Logs a new answer submission
   */
  public create(submission: Submission): Submission {
    return this.dbEngine.transaction<Submission>((dbState) => {
      // Avoid duplicated log records
      const exists = dbState.submissions.some(
        s => s.user_id === submission.user_id && s.question_id === submission.question_id
      );

      if (exists) {
        throw new Error(`Double-submission: Question ${submission.question_id} already answered by ${submission.user_id}`);
      }

      const newSubmission: Submission = {
        ...submission,
        answered_at: submission.answered_at || new Date().toISOString()
      };

      dbState.submissions.push(newSubmission);

      return {
        nextDb: dbState,
        result: { ...newSubmission }
      };
    });
  }

  /**
   * Finds a submission by user ID and question ID to check double-answering
   */
  public getByUserAndQuestion(userId: string, questionId: string): Submission | null {
    const data = this.dbEngine.read();
    const submission = data.submissions.find(
      s => s.user_id === userId && s.question_id === questionId
    );
    return submission ? { ...submission } : null;
  }

  /**
   * Aggregates submissions logged within the current UTC day calendar frame.
   * Resets daily boundaries nicely using local midnight equivalents.
   */
  public getUserSubmissionsToday(userId: string): Submission[] {
    const data = this.dbEngine.read();
    
    // Calculate the start of the current calendar day in UTC (Midnight)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const startOfTodayTime = startOfToday.getTime();

    return data.submissions.filter(s => {
      if (s.user_id !== userId) return false;
      const submissionTime = new Date(s.answered_at).getTime();
      return submissionTime >= startOfTodayTime;
    });
  }

  /**
   * Total answers submitted over a user's lifetime
   */
  public getUserSubmissionsCount(userId: string): number {
    const data = this.dbEngine.read();
    return data.submissions.filter(s => s.user_id === userId).length;
  }
}
