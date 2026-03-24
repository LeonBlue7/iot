import { test, expect } from '@playwright/test';

/**
 * 设备管理页面 E2E 测试
 * 覆盖设备列表、搜索、控制等核心流程
 */
test.describe('设备管理', () => {
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

    // 导航到设备管理页面 - 使用菜单选择器
    await page.getByRole('menu').getByText('设备管理').click();
    await page.waitForURL(/\/devices/, { timeout: 5000 });
  });

  test('应该显示设备列表页面', async ({ page }) => {
    // 验证页面标题 - 使用 h1 选择器
    await expect(page.getByRole('heading', { name: '设备管理' })).toBeVisible();

    // 验证设备表格存在
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('应该支持设备更名', async ({ page }) => {
    // 等待表格加载
    await page.waitForTimeout(2000);

    // 检查表格是否有数据
    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // 检查是否有"暂无数据"提示
    const emptyText = await page.getByText('暂无数据').count();

    if (emptyText > 0) {
      // 没有设备数据时跳过测试
      return;
    }

    // 获取所有行，检查是否有设备数据
    const rows = table.locator('tbody tr');
    const count = await rows.count();

    if (count === 0) {
      return;
    }

    // 点击编辑按钮 - 使用 CSS 选择器和文本
    // 编辑按钮结构：<Button type="link" icon={<EditOutlined />} onClick={...}>编辑</Button>
    const editButton = page.locator('button:has-text("编辑")').first();
    await editButton.click();

    // 等待弹窗出现
    await page.waitForTimeout(500);

    // 验证弹窗标题
    await expect(page.getByText('编辑设备信息')).toBeVisible();

    // 填写新名称
    const testName = `Test_${Date.now()}`;
    await page.getByLabel('设备名称').fill(testName);

    // 点击确定
    await page.getByRole('button', { name: '确定' }).click();

    // 等待更新完成
    await page.waitForTimeout(1000);

    // 验证成功提示
    await expect(page.getByText(/设备信息更新成功/)).toBeVisible();
  });
});
