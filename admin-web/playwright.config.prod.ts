import { defineConfig, devices } from '@playwright/test';

/**
 * 生产环境诊断测试配置
 *
 * 运行命令:
 * npx playwright test --config=playwright.config.prod.ts
 */

export default defineConfig({
  testDir: './e2e/diag',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60000,
  reporter: [
    ['html', { outputFolder: 'test-results/diag-report/html' }],
    ['list'],
  ],
  outputDir: 'test-results/diag-artifacts/',

  use: {
    baseURL: 'https://www.jxbonner.cloud',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});