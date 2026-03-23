// miniprogram/tests/setup.ts
import { jest } from '@jest/globals';

beforeEach(() => {
  // 启用 fake timers
  jest.useFakeTimers();
});

afterEach(() => {
  // 恢复真实 timers
  jest.useRealTimers();
});
