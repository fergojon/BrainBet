/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { CONFIG } from '../core/config.js';
import { Question } from '../models/types.js';
import { QuestionRepository } from '../repositories/QuestionRepository.js';

export class AIService {
  private aiClient: GoogleGenAI | null = null;

  constructor(private questionRepo = new QuestionRepository()) {}

  /**
   * Lazily instantiates the Google GenAI SDK client to prevent startup failures.
   * Leverages custom telemetry tracking headers.
   */
  private getAIClient(): GoogleGenAI {
    if (this.aiClient) return this.aiClient;

    const apiKey = CONFIG.GEMINI.API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }

    this.aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    return this.aiClient;
  }

  /**
   * Generates custom, thematic multiple-choice questions on-the-fly using Gemini.
   * Auto-validates schema outputs, seeds the generated questions into the main bank, 
   * and returns them for immediate user interaction.
   */
  public async generateQuestions(
    category: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    count = 3
  ): Promise<Question[]> {
    // If no key is set, we bypass and throw a helpful user-facing error rather than failing silently
    if (!CONFIG.GEMINI.API_KEY) {
      console.warn('AIService: GEMINI_API_KEY is not defined. Falling back to structured default banks.');
      throw new Error('AI Generation requires an active Gemini API key. Please configure GEMINI_API_KEY in the Secrets panel.');
    }

    const ai = this.getAIClient();

    const difficultyRewards = { easy: 10, medium: 20, hard: 35 };
    const reward = difficultyRewards[difficulty] || 20;

    const prompt = `Generate exactly ${count} multiple choice trivia questions about the topic/theme: "${category}".
    The questions must be highly engaging, accurate, and suitable for a tech-savvy audience. 
    The difficulty must be calibrated to: "${difficulty}".
    Provide original questions, clear wrong options, and the correct option index ('A', 'B', 'C', or 'D').`;

    try {
      const response = await ai.models.generateContent({
        model: CONFIG.GEMINI.MODEL,
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite, gamified trivia curator for BrainBet, a modern quiz betting platform. Return questions in strict JSON format.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'List of generated trivia questions',
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: 'The text of the question' },
                option_a: { type: Type.STRING, description: 'Option A value' },
                option_b: { type: Type.STRING, description: 'Option B value' },
                option_c: { type: Type.STRING, description: 'Option C value' },
                option_d: { type: Type.STRING, description: 'Option D value' },
                correct_option: { 
                  type: Type.STRING, 
                  description: 'The correct answer letter index. Must be precisely "A", "B", "C", or "D".' 
                }
              },
              required: ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option']
            }
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini API returned an empty response.');
      }

      // Parse JSON array
      const rawQuestions = JSON.parse(responseText.trim());
      if (!Array.isArray(rawQuestions)) {
        throw new Error('Parsed response is not a valid question array.');
      }

      const generatedQuestions: Question[] = [];

      // Process and insert questions into local database cache
      for (const raw of rawQuestions) {
        // Enforce type assertion and clean indices
        const correctOpt = String(raw.correct_option).toUpperCase().trim();
        const validCorrect: 'A' | 'B' | 'C' | 'D' = 
          (correctOpt === 'A' || correctOpt === 'B' || correctOpt === 'C' || correctOpt === 'D') 
            ? correctOpt 
            : 'A';

        const qId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const cleanedQuestion: Question = {
          id: qId,
          question: String(raw.question).trim(),
          option_a: String(raw.option_a).trim(),
          option_b: String(raw.option_b).trim(),
          option_c: String(raw.option_c).trim(),
          option_d: String(raw.option_d).trim(),
          correct_option: validCorrect,
          difficulty,
          category: category.toUpperCase().trim(),
          reward,
          created_at: new Date().toISOString()
        };

        // Seed to database
        this.questionRepo.create(cleanedQuestion);
        generatedQuestions.push(cleanedQuestion);
      }

      return generatedQuestions;

    } catch (error) {
      console.error('AIService generation breakdown:', error);
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
export const aiService = new AIService();
