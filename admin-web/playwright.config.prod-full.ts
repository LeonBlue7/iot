import { defineConfig, devices } from '@playwright/test';

/**
 * 生产环境全面E2E测试配置
 *
 * 运行命令:
 * npx playwright test --config=playwright.config.prod-full.ts --headed
 */

export default defineConfig({
  testDir: './e2e',
  testMatch: 'prod-full-e2e.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 300000,
  reporter: [
    ['html', { outputFolder: 'test-results/prod-e2e-report' }],
    ['json', { outputFile: 'test-results/prod-e2e-results.json' }],
    ['list'],
  ],
  outputDir: 'test-results/prod-e2e-artifacts/',

  use: {
    baseURL: 'https://www.jxbonner.cloud',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});