/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Validates the body parameters of a quiz submission request.
 */
export function validateSubmissionPayload(body: any): {
  isValid: boolean;
  error?: string;
  data?: {
    question_id: string;
    selected_option: 'A' | 'B' | 'C' | 'D';
    telegram_id?: string;
  };
} {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object.' };
  }

  const { question_id, selected_option, telegram_id } = body;

  if (!question_id || typeof question_id !== 'string' || question_id.trim().length === 0) {
    return { isValid: false, error: 'Field "question_id" must be a non-empty string.' };
  }

  const cleanedOption = String(selected_option).toUpperCase().trim();
  if (cleanedOption !== 'A' && cleanedOption !== 'B' && cleanedOption !== 'C' && cleanedOption !== 'D') {
    return { isValid: false, error: 'Field "selected_option" must be one of "A", "B", "C", or "D".' };
  }

  return {
    isValid: true,
    data: {
      question_id: question_id.trim(),
      selected_option: cleanedOption as 'A' | 'B' | 'C' | 'D',
      telegram_id: telegram_id ? String(telegram_id).trim() : undefined
    }
  };
}

/**
 * Validates the query/body parameters of an AI question generation request.
 */
export function validateAIGenerationPayload(body: any): {
  isValid: boolean;
  error?: string;
  data?: {
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    count: number;
  };
} {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a valid JSON object.' };
  }

  const { category, difficulty, count } = body;

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    return { isValid: false, error: 'Field "category" must be a non-empty string.' };
  }

  if (category.trim().length > 40) {
    return { isValid: false, error: 'Field "category" exceeds the maximum length of 40 characters.' };
  }

  const cleanedDifficulty = String(difficulty || 'medium').toLowerCase().trim();
  if (cleanedDifficulty !== 'easy' && cleanedDifficulty !== 'medium' && cleanedDifficulty !== 'hard') {
    return { isValid: false, error: 'Field "difficulty" must be one of "easy", "medium", or "hard".' };
  }

  let parsedCount = parseInt(count, 10);
  if (isNaN(parsedCount)) {
    parsedCount = 3; // Default fallback
  }

  if (parsedCount < 1 || parsedCount > 10) {
    return { isValid: false, error: 'Field "count" must be an integer between 1 and 10.' };
  }

  return {
    isValid: true,
    data: {
      category: category.trim(),
      difficulty: cleanedDifficulty as 'easy' | 'medium' | 'hard',
      count: parsedCount
    }
  };
}
