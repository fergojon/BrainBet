/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { CONFIG } from '../core/config.js';
import { DatabaseSchema, Question } from '../models/types.js';

/**
 * Custom Transactional JSON Database Engine
 * Designed for lightweight, robust persistence with file lock prevention and atomic writes.
 */
export class DatabaseEngine {
  private static instance: DatabaseEngine;
  private memoryCache: DatabaseSchema | null = null;
  private isWriting = false;

  private constructor() {
    this.initializeDatabase();
  }

  /**
   * Singleton pattern to prevent multiple read/write descriptors
   */
  public static getInstance(): DatabaseEngine {
    if (!DatabaseEngine.instance) {
      DatabaseEngine.instance = new DatabaseEngine();
    }
    return DatabaseEngine.instance;
  }

  /**
   * Initializes database directories and checks for existence of file.
   * If non-existent, bootstraps the JSON file structure.
   */
  private initializeDatabase(): void {
    const dataDir = path.dirname(CONFIG.DATABASE.DB_FILE_PATH);
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(CONFIG.DATABASE.DB_FILE_PATH)) {
      const initialSchema: DatabaseSchema = {
        users: [],
        questions: [],
        submissions: [],
        withdrawals: [],
        tournaments: [],
        settings: {
          withdrawals_enabled: true
        }
      };
      this.writeToDisk(initialSchema);
      console.log('Database file created and initialized at:', CONFIG.DATABASE.DB_FILE_PATH);
    }
  }

  /**
   * Reads data from the disk. Employs caching to optimize high-volume retrieval.
   */
  public read(): DatabaseSchema {
    if (this.memoryCache) {
      return this.memoryCache;
    }

    try {
      const dataStr = fs.readFileSync(CONFIG.DATABASE.DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(dataStr) as DatabaseSchema;
      if (!parsed.withdrawals) {
        parsed.withdrawals = [];
      }
      if (!parsed.tournaments) {
        parsed.tournaments = [];
      }
      if (!parsed.settings) {
        parsed.settings = { withdrawals_enabled: true };
      }
      this.memoryCache = parsed;
      return parsed;
    } catch (error) {
      console.error('Error reading database file, attempting recovery of layout:', error);
      const fallback: DatabaseSchema = { users: [], questions: [], submissions: [], withdrawals: [], tournaments: [], settings: { withdrawals_enabled: true } };
      return fallback;
    }
  }

  /**
   * Atomically writes data to disk using a temporary file and rename method.
   * This completely avoids file-truncation corruption if the process crashes mid-write.
   */
  private writeToDisk(data: DatabaseSchema): void {
    const tempPath = `${CONFIG.DATABASE.DB_FILE_PATH}.tmp`;
    const finalPath = CONFIG.DATABASE.DB_FILE_PATH;

    try {
      this.isWriting = true;
      const dataStr = JSON.stringify(data, null, 2);
      
      // Write to temporary file first
      fs.writeFileSync(tempPath, dataStr, 'utf-8');
      
      // Rename temporary file to target path atomically
      fs.renameSync(tempPath, finalPath);
      
      // Update our internal memory cache
      this.memoryCache = data;
    } catch (error) {
      console.error('Atomic write failed for JSON database:', error);
      throw new Error('Database write failure: Integrity compromised.');
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Executes a callback function inside a transactional callback lock.
   * Ensures read-modify-write loops remain sequential and consistent.
   */
  public transaction<T>(callback: (db: DatabaseSchema) => { nextDb: DatabaseSchema; result: T }): T {
    // Basic spin-lock check for concurrent execution safety
    if (this.isWriting) {
      let limit = 100;
      while (this.isWriting && limit > 0) {
        // Synchronous sleep-wait loop to let the file lock release
        const end = Date.now() + 5;
        while (Date.now() < end) {}
        limit--;
      }
    }

    const currentDb = this.read();
    
    // Deep clone state to ensure isolated changes inside the callback
    const clonedDb: DatabaseSchema = JSON.parse(JSON.stringify(currentDb));
    
    const { nextDb, result } = callback(clonedDb);
    
    this.writeToDisk(nextDb);
    return result;
  }

  /**
   * Truncates/Clears specific schemas (Useful for testing)
   */
  public reset(): void {
    const cleanSchema: DatabaseSchema = {
      users: [],
      questions: [],
      submissions: [],
      withdrawals: [],
      tournaments: [],
      settings: {
        withdrawals_enabled: true
      }
    };
    this.writeToDisk(cleanSchema);
  }
}
export const db = DatabaseEngine.getInstance();
