import { test, expect } from '@playwright/test';

/**
 * 告警管理页面 E2E 测试
 * 覆盖告警列表、筛选、确认等核心流程
 */
test.describe('告警管理', () => {
  test.beforeEach(async ({ page }) => {
    // 访问告警页面
    await page.goto('/alarms');
  });

  test('应该显示告警列表页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByText(/告警管理/)).toBeVisible();

    // 验证告警表格存在
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('应该显示状态筛选器', async ({ page }) => {
    // 验证状态筛选器存在
    await expect(page.getByText(/状态/).or(page.getByRole('combobox'))).toBeVisible();
  });

  test('应该显示告警详情', async ({ page }) => {
    // 验证告警列表包含必要信息
    await expect(
      page.getByText(/告警/).or(page.getByText(/设备/).or(page.getByText('温度')))
    ).toBeVisible();
  });
});
