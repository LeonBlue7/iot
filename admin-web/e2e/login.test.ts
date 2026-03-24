import { test, expect } from '@playwright/test';

/**
 * 登录页面 E2E 测试
 * 覆盖核心登录流程
 */
test.describe('登录页面', () => {
  test('应该显示登录表单', async ({ page }) => {
    await page.goto('/login');

    // 验证页面标题 - 实际标题是"物联网管理系统 - 管理后台"
    await expect(page).toHaveTitle(/物联网管理系统/);

    // 验证页面主要内容 - 标题和副标题
    await expect(page.getByText('物联网管理系统')).toBeVisible();
    await expect(page.getByText('管理后台登录')).toBeVisible();
  });

  test('应该验证空用户名和密码', async ({ page }) => {
    await page.goto('/login');

    // 尝试空提交 - 使用 CSS 选择器点击登录按钮
    await page.locator('button[type="submit"]').click();

    // 验证错误提示
    await expect(page.getByText(/请输入用户名/)).toBeVisible();
  });

  test('应该成功登录并跳转', async ({ page }) => {
    await page.goto('/login');

    // 填写登录表单
    await page.getByPlaceholder('用户名').fill('admin');
    await page.getByPlaceholder('密码').fill('admin123');

    // 提交登录 - 使用 CSS 选择器
    await page.locator('button[type="submit"]').click();

    // 等待旋转到 dashboard 页面
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // 验证跳转成功
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
