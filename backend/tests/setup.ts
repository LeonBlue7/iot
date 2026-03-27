import { beforeAll, afterAll, jest } from '@jest/globals';

// Mock Redis in tests
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    keys: jest.fn().mockResolvedValue([]),
    ping: jest.fn().mockResolvedValue('PONG'),
    flushdb: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn().mockReturnThis(),
    connect: jest.fn(),
  };
  return jest.fn().mockImplementation(() => mockRedis);
});

beforeAll(() => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Cleanup test environment
  // Clear all mocks
  jest.clearAllMocks();
  // Force exit to prevent hanging
  await new Promise((resolve) => setTimeout(resolve, 100));
});