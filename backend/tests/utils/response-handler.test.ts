// tests/utils/response-handler.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler, errorHandler } from '../../src/utils/response.js';
import { AppError, NotFoundError } from '../../src/utils/errors.js';

describe('asyncHandler', () => {
  it('should call the wrapped function', async () => {
    const mockFn = jest.fn((_req: Request, res: Response, _next: NextFunction): Promise<void> => {
      res.json({ success: true });
      return Promise.resolve();
    });

    const handler = asyncHandler(mockFn);
    const mockReq = {} as Request;
    const mockRes = { json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn();

    handler(mockReq, mockRes, mockNext);

    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });

  it('should catch errors and pass to next', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn((_req: Request, _res: Response, _next: NextFunction): Promise<void> =>
      Promise.reject(error)
    );

    const handler = asyncHandler(mockFn);
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = jest.fn();

    handler(mockReq, mockRes, mockNext);

    // Wait for promise to resolve
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should pass AppError to next handler', async () => {
    const appError = new NotFoundError('Resource not found');
    const mockFn = jest.fn((_req: Request, _res: Response, _next: NextFunction): Promise<void> =>
      Promise.reject(appError)
    );

    const handler = asyncHandler(mockFn);
    const mockNext = jest.fn();

    handler({} as Request, {} as Response, mockNext);

    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockNext).toHaveBeenCalledWith(appError);
  });
});

describe('errorHandler', () => {
  it('should handle AppError with correct status code', () => {
    const error = new AppError('Bad request', 400);
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn();

    errorHandler(error, {} as Request, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Bad request',
    });
  });

  it('should handle NotFoundError', () => {
    const error = new NotFoundError('User not found');
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn();

    errorHandler(error, {} as Request, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'User not found',
    });
  });

  it('should handle generic errors with 500 status', () => {
    const error = new Error('Unexpected error');
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn();

    errorHandler(error, {} as Request, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal Server Error',
    });
  });

  it('should log unhandled errors', () => {
    const error = new Error('Unexpected error');
    const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    const mockNext = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(error, {} as Request, mockRes, mockNext);

    // logger.error calls console.error with formatted message
    expect(consoleSpy).toHaveBeenCalled();
    const calls = consoleSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const callArgs = calls[0] as string[];
    expect(callArgs[0]).toContain('Unhandled error');
    expect(callArgs[0]).toContain('Unexpected error');

    consoleSpy.mockRestore();
  });
});