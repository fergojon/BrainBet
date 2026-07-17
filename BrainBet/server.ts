/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { CONFIG } from './server/core/config.js';
import { db } from './server/database/engine.js';
import { seedDatabase } from './server/database/seed.js';
import { apiRouter } from './server/api/routes.js';
import { errorHandler } from './server/middleware/errorHandler.js';

async function startServer() {
  const app = express();

  // 1. Initialize and Seed the Database on boot inside an isolated transaction
  try {
    db.transaction((dbState) => {
      const seeded = seedDatabase(dbState);
      if (seeded) {
        console.log('[System Boot] Transaction completed: Database seeded with premium question bank.');
      } else {
        console.log('[System Boot] Database verification complete. Questions already present.');
      }
      return { nextDb: dbState, result: seeded };
    });
  } catch (error) {
    console.error('[System Boot] Database boot transaction failed:', error);
  }

  // 2. Global Request Middlewares
  app.use(cors({ origin: '*' })); // Enable loose CORS policies for Telegram iframe sandboxes
  app.use(express.json());

  // 3. Mount Backend API Endpoints
  app.use('/api', apiRouter);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      time: new Date().toISOString(),
      database_records: {
        users: db.read().users.length,
        questions: db.read().questions.length,
        submissions: db.read().submissions.length
      }
    });
  });

  // 4. Mount Vite Middleware for Assets and Single Page Router Fallback
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Dev Engine] Initializing Vite middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Production Engine] Mounting compiled bundle folders...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 5. Global Error Handler Middleware
  app.use(errorHandler);

  // 6. Start listening on the hardcoded port 3000
  const PORT = CONFIG.PORT;
  app.listen(PORT, '0.0.0.0', () => {
    console.log('===================================================');
    console.log(`🚀 BrainBet Full-Stack Server Running Successfully`);
    console.log(`   Host: http://0.0.0.0:${PORT}`);
    console.log(`   Environment: ${CONFIG.NODE_ENV.toUpperCase()}`);
    console.log('===================================================');
  });
}

startServer().catch((error) => {
  console.error('[System Crash] Failed to boot express application:', error);
  process.exit(1);
});
