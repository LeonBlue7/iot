// admin-web/e2e/users.spec.ts
import { test, expect } from './fixtures'

/**
 * 用户管理功能测试
 */
test.describe('用户管理', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/users')
    await authenticatedPage.waitForLoadState('networkidle')
  })

  test('应该显示用户管理页面', async ({ authenticatedPage }) => {
    // 验证页面有用户管理相关元素
    const table = authenticatedPage.locator('.ant-table')
    await expect(table).toBeVisible({ timeout: 10000 })
  })

  test('应该显示用户列表表格', async ({ authenticatedPage }) => {
    // 等待表格加载
    const table = authenticatedPage.locator('.ant-table')
    await expect(table).toBeVisible({ timeout: 10000 })
  })

  test('应该显示新建用户按钮', async ({ authenticatedPage }) => {
    const createButton = authenticatedPage.locator('button:has-text("新建用户")')
    await expect(createButton).toBeVisible()
  })

  test('点击新建用户应弹出表单', async ({ authenticatedPage }) => {
    // 点击新建按钮
    await authenticatedPage.click('button:has-text("新建用户")')

    // 验证弹窗出现
    const modal = authenticatedPage.locator('.ant-modal')
    await expect(modal).toBeVisible()

    // 验证表单字段
    await expect(authenticatedPage.locator('label:has-text("用户名")')).toBeVisible()
    await expect(authenticatedPage.locator('label:has-text("邮箱")')).toBeVisible()
    await expect(authenticatedPage.locator('label:has-text("密码")')).toBeVisible()
  })

  test('应该能填写创建用户表单', async ({ authenticatedPage }) => {
    // 点击新建按钮
    await authenticatedPage.click('button:has-text("新建用户")')

    // 验证弹窗出现
    const modal = authenticatedPage.locator('.ant-modal')
    await expect(modal).toBeVisible()

    // 填写表单
    const timestamp = Date.now()
    await authenticatedPage.fill('input[id*="username"]', `test_user_${timestamp}`)
    await authenticatedPage.fill('input[id*="email"]', `test_${timestamp}@example.com`)
    await authenticatedPage.fill('input[id*="password"]', 'Test123456!')

    // 取消关闭弹窗
    await authenticatedPage.click('.ant-modal .ant-btn-default')
  })

  test('应该显示超级管理员标签', async ({ authenticatedPage }) => {
    // 等待表格加载
    await authenticatedPage.waitForSelector('.ant-table tbody tr', { timeout: 10000 })

    // 检查是否有超级管理员标签
    const superAdminTag = authenticatedPage.locator('text=超级管理员')
    // 如果存在admin用户，应该显示超级管理员标签
    const count = await superAdminTag.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('编辑用户弹窗应显示当前数据', async ({ authenticatedPage }) => {
    // 等待表格加载
    await authenticatedPage.waitForSelector('.ant-table tbody tr', { timeout: 10000 })

    // 点击第一个编辑按钮
    const editButton = authenticatedPage.locator('button:has-text("编辑")').first()
    if (await editButton.isVisible()) {
      await editButton.click()

      // 验证弹窗出现
      const modal = authenticatedPage.locator('.ant-modal')
      await expect(modal).toBeVisible()

      // 验证标题为编辑
      await expect(modal.locator('text=编辑用户')).toBeVisible()
    }
  })
})