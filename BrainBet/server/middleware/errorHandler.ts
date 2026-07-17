/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Centered Global Express Error Handling Middleware
 * Catch all unhandled thread rejections and formats standard, secure response envelopes.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.status || 500;
  const message = err.message || 'An internal server aberration occurred.';
  
  // High durability logging detailing active pipelines
  console.error(`[Express Error Handler] Catastrophic failure at [${req.method} ${req.path}]:`, {
    message,
    statusCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(statusCode).json({
    status: 'error',
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: err.stack })
    }
  });
}
