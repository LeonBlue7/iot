import { test, expect } from '@playwright/test';

/**
 * 设备管理页面 E2E 测试
 * 覆盖设备列表、搜索、控制等核心流程
 */
test.describe('设备管理', () => {
  test.beforeEach(async ({ page }) => {
    // 访问设备页面
    await page.goto('/devices');
  });

  test('应该显示设备列表页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByText(/设备管理/)).toBeVisible();

    // 验证设备表格存在
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('应该显示搜索框', async ({ page }) => {
    // 验证搜索框存在
    const searchInput = page.getByPlaceholder(/搜索设备/);
    await expect(searchInput).toBeVisible();
  });

  test('应该显示在线/离线状态', async ({ page }) => {
    // 验证状态列存在
    await expect(page.getByText(/在线/).or(page.getByText(/离线/))).toBeVisible();
  });

  test('应该支持刷新设备列表', async ({ page }) => {
    // 点击刷新按钮
    await page.getByRole('button', { name: /刷新/i }).click();

    // 验证列表重新加载（可以通过加载状态或数据变化验证）
    await page.waitForTimeout(1000);

    // 验证设备表格仍然存在
    await expect(page.getByRole('table')).toBeVisible();
  });
});
