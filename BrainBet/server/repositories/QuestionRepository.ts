/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseEngine } from '../database/engine.js';
import { Question } from '../models/types.js';

export interface IQuestionRepository {
  getById(id: string): Question | null;
  create(question: Question): Question;
  update(question: Question): Question;
  delete(id: string): boolean;
  getUnansweredQuestions(userId: string, difficulty?: 'easy' | 'medium' | 'hard', limit?: number, category?: string): Question[];
  getAll(): Question[];
}

export class QuestionRepository implements IQuestionRepository {
  constructor(private dbEngine = DatabaseEngine.getInstance()) {}

  /**
   * Fetches a question entity by its UUID
   */
  public getById(id: string): Question | null {
    const data = this.dbEngine.read();
    const question = data.questions.find(q => q.id === id);
    return question ? { ...question } : null;
  }

  /**
   * Saves a new question (useful for seeder or on-the-fly AI question generation)
   */
  public create(question: Question): Question {
    return this.dbEngine.transaction<Question>((dbState) => {
      // Prevent key collisions
      if (dbState.questions.some(q => q.id === question.id)) {
        throw new Error(`Question with id ${question.id} already exists.`);
      }

      const newQuestion = {
        ...question,
        created_at: question.created_at || new Date().toISOString()
      };

      dbState.questions.push(newQuestion);

      return {
        nextDb: dbState,
        result: { ...newQuestion }
      };
    });
  }

  /**
   * Updates an existing question
   */
  public update(question: Question): Question {
    return this.dbEngine.transaction<Question>((dbState) => {
      const index = dbState.questions.findIndex(q => q.id === question.id);
      if (index === -1) {
        throw new Error(`Question with id ${question.id} not found.`);
      }

      const updatedQuestion = {
        ...question
      };

      dbState.questions[index] = updatedQuestion;

      return {
        nextDb: dbState,
        result: { ...updatedQuestion }
      };
    });
  }

  /**
   * Deletes a question
   */
  public delete(id: string): boolean {
    return this.dbEngine.transaction<boolean>((dbState) => {
      const index = dbState.questions.findIndex(q => q.id === id);
      if (index === -1) {
        return {
          nextDb: dbState,
          result: false
        };
      }

      dbState.questions.splice(index, 1);

      return {
        nextDb: dbState,
        result: true
      };
    });
  }

  /**
   * Resolves questions that the specific user hasn't submitted answers for yet.
   * Supports random shuffling, difficulty filter, and output limits.
   */
  public getUnansweredQuestions(
    userId: string,
    difficulty?: 'easy' | 'medium' | 'hard',
    limit = 5,
    category?: string
  ): Question[] {
    const data = this.dbEngine.read();
    
    // Get all question IDs answered by this specific user
    const answeredQuestionIds = new Set(
      data.submissions
        .filter(s => s.user_id === userId)
        .map(s => s.question_id)
    );

    // Filter questions that are not answered yet, and match difficulty if specified
    let candidates = data.questions.filter(q => !answeredQuestionIds.has(q.id));

    if (difficulty) {
      candidates = candidates.filter(q => q.difficulty === difficulty);
    }

    if (category) {
      candidates = candidates.filter(q => q.category.toLowerCase() === category.toLowerCase());
    }

    // Modern high-performance shuffle algorithm (Fisher-Yates)
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, limit);
  }

  /**
   * Returns all questions currently in database
   */
  public getAll(): Question[] {
    return this.dbEngine.read().questions.map(q => ({ ...q }));
  }
}
