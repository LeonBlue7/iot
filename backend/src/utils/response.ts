// src/utils/response.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors.js';
import logger from './logger.js';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function errorResponse(error: string, message?: string): ApiResponse<never> {
  return {
    success: false,
    error,
    message,
  };
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json(errorResponse('Internal Server Error'));
}