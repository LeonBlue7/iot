// tests/utils/index.test.ts
import { describe, it, expect } from '@jest/globals';
import * as utils from '../../src/utils/index.js';

describe('Utils Index', () => {
  it('should export prisma', () => {
    expect(utils.prisma).toBeDefined();
  });

  it('should export redis', () => {
    expect(utils.redis).toBeDefined();
  });

  it('should export CacheKeys', () => {
    expect(utils.CacheKeys).toBeDefined();
  });

  it('should export CacheTTL', () => {
    expect(utils.CacheTTL).toBeDefined();
  });

  it('should export AppError', () => {
    expect(utils.AppError).toBeDefined();
  });

  it('should export NotFoundError', () => {
    expect(utils.NotFoundError).toBeDefined();
  });

  it('should export ValidationError', () => {
    expect(utils.ValidationError).toBeDefined();
  });

  it('should export UnauthorizedError', () => {
    expect(utils.UnauthorizedError).toBeDefined();
  });

  it('should export successResponse', () => {
    expect(utils.successResponse).toBeDefined();
  });

  it('should export errorResponse', () => {
    expect(utils.errorResponse).toBeDefined();
  });

  it('should export asyncHandler', () => {
    expect(utils.asyncHandler).toBeDefined();
  });

  it('should export errorHandler', () => {
    expect(utils.errorHandler).toBeDefined();
  });
});
