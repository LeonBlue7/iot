// tests/utils/response.test.ts
import { describe, it, expect } from '@jest/globals';
import { successResponse, errorResponse } from '../../src/utils/response.js';
import { AppError, NotFoundError, ValidationError, UnauthorizedError } from '../../src/utils/errors.js';

describe('Response Utils', () => {
  describe('successResponse', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'test' };
      const result = successResponse(data);

      expect(result).toEqual({
        success: true,
        data,
      });
    });

    it('should create success response with message', () => {
      const data = { id: 1 };
      const message = 'Operation successful';
      const result = successResponse(data, message);

      expect(result).toEqual({
        success: true,
        data,
        message,
      });
    });

    it('should create success response without data', () => {
      const result = successResponse(null, 'Done');

      expect(result).toEqual({
        success: true,
        data: null,
        message: 'Done',
      });
    });
  });

  describe('errorResponse', () => {
    it('should create error response', () => {
      const result = errorResponse('Something went wrong');

      expect(result).toEqual({
        success: false,
        error: 'Something went wrong',
      });
    });

    it('should create error response with message', () => {
      const result = errorResponse('Validation failed', 'Please check input');

      expect(result).toEqual({
        success: false,
        error: 'Validation failed',
        message: 'Please check input',
      });
    });
  });
});

describe('Errors', () => {
  describe('AppError', () => {
    it('should create AppError with default status code', () => {
      const error = new AppError('Something went wrong');

      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should create AppError with custom status code', () => {
      const error = new AppError('Bad request', 400);

      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
    });

    it('should create non-operational error', () => {
      const error = new AppError('Internal error', 500, false);

      expect(error.isOperational).toBe(false);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with default message', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create NotFoundError with custom message', () => {
      const error = new NotFoundError('User not found');

      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with default message', () => {
      const error = new ValidationError();

      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create UnauthorizedError', () => {
      const error = new UnauthorizedError('Invalid token');

      expect(error.message).toBe('Invalid token');
      expect(error.statusCode).toBe(401);
    });
  });
});