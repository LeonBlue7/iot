import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 *
 * 运行测试:
 * - npx playwright test           # 运行所有测试
 * - npx playwright test --ui     # 使用 UI 模式
 * - npx playwright test --headed # 有头模式运行
 * - npx playwright test login    # 运行特定测试
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 禁用完全并行以避免登录冲突
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 单线程运行避免并发问题
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  outputDir: 'test-results/',

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox 和 WebKit 可能需要额外依赖，暂时禁用
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // 注意：webServer 已禁用，因为前端服务已经独立运行
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3002',
  //   reuseExistingServer: true,
  // },
});
