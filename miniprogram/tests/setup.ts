// miniprogram/tests/setup.ts
import { jest } from '@jest/globals';

// 模拟微信小程序全局变量 __wxConfig
declare global {
  // eslint-disable-next-line no-var
  var __wxConfig: { envVersion: string };
}

// 设置 __wxConfig 默认值（在测试环境中使用）
global.__wxConfig = {
  envVersion: 'develop', // 'develop' | 'trial' | 'release'
};

beforeEach(() => {
  // 启用 fake timers
  jest.useFakeTimers();
});

afterEach(() => {
  // 恢复真实 timers
  jest.useRealTimers();
});
