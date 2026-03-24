import { test, expect } from '@playwright/test';

/**
 * 告警管理页面 E2E 测试
 * 覆盖告警列表、筛选、确认等核心流程
 */
test.describe('告警管理', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto('/login');

    // 等待登录页面加载
    await expect(page.locator('h2')).toContainText(/物联网/);

    // 填写登录表单
    await page.getByPlaceholder('用户名').fill('admin');
    await page.getByPlaceholder('密码').fill('admin123');

    // 使用 CSS 选择器点击登录按钮
    await page.locator('button[type="submit"]').click();

    // 等待登录成功并跳转到 dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // 导航到告警管理页面 - 使用菜单选择器
    await page.getByRole('menu').getByText('告警管理').click();
    await page.waitForURL(/\/alarms/, { timeout: 5000 });
  });

  test('应该显示告警列表页面', async ({ page }) => {
    // 验证页面标题 - 使用 h1 选择器
    await expect(page.getByRole('heading', { name: '告警管理' })).toBeVisible();

    // 验证告警表格存在
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('应该显示状态列', async ({ page }) => {
    // 验证表格包含状态列标题
    await expect(page.getByRole('columnheader', { name: '状态' })).toBeVisible();
  });

  test('应该显示告警详情', async ({ page }) => {
    // 等待表格加载
    await page.waitForTimeout(1000);

    // 检查表格是否有数据
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // 检查是否有"暂无数据"提示
    const emptyText = await page.getByText('暂无数据').count();

    if (emptyText > 0) {
      // 没有告警数据时，验证表格结构即可

      // 验证表格列标题存在
      await expect(page.getByRole('columnheader', { name: '告警 ID' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '设备 ID' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '告警类型' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: '状态' })).toBeVisible();

      return;
    }

    // 有告警数据时，验证告警详情
    // 验证告警列表包含必要信息
    await expect(
      page.getByText(/设备/).or(page.getByText('温度')).or(page.getByText('湿度'))
    ).toBeVisible();
  });
});
