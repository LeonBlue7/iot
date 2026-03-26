import { test, expect } from '@playwright/test'
import { LoginPage } from './pages'

/**
 * 登录流程 E2E 测试
 *
 * 测试场景：
 * 1. 登录页面加载
 * 2. 成功登录
 * 3. 登录失败（错误凭证）
 * 4. 表单验证（空字段）
 */
test.describe('登录流程', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('登录页面应正确加载', async ({ page }) => {
    // 验证页面标题
    await expect(loginPage.title).toBeVisible()
    await expect(loginPage.title).toContainText('物联网管理系统')

    // 验证表单元素存在
    await expect(loginPage.usernameInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
  })

  test('使用正确凭证登录成功', async ({ page }) => {
    // 执行登录
    await loginPage.login('admin', 'admin123')

    // 验证登录成功，跳转到仪表盘
    await loginPage.expectLoginSuccess()
    await expect(page).toHaveURL(/\/dashboard/)

    // 验证成功提示
    await expect(page.locator('.ant-message-success')).toBeVisible()
  })

  test('使用错误密码登录失败', async ({ page }) => {
    // 使用错误密码
    await loginPage.login('admin', 'wrongpassword')

    // 验证错误提示
    await loginPage.expectLoginError()

    // 验证仍在登录页面
    await expect(page).toHaveURL(/\/login/)
  })

  test('使用不存在的用户登录失败', async ({ page }) => {
    // 使用不存在的用户
    await loginPage.login('nonexistent', 'password123')

    // 验证错误提示
    await loginPage.expectLoginError()

    // 验证仍在登录页面
    await expect(page).toHaveURL(/\/login/)
  })

  test('用户名为空时显示验证错误', async ({ page }) => {
    // 只输入密码
    await loginPage.passwordInput.fill('admin123')
    await loginPage.submitButton.click()

    // 验证验证错误信息
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('请输入用户名')
  })

  test('密码为空时显示验证错误', async ({ page }) => {
    // 只输入用户名
    await loginPage.usernameInput.fill('admin')
    await loginPage.submitButton.click()

    // 验证验证错误信息
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('请输入密码')
  })

  test('用户名和密码都为空时显示验证错误', async ({ page }) => {
    // 不输入任何内容直接提交
    await loginPage.submitButton.click()

    // 验证两个验证错误
    const errors = page.locator('.ant-form-item-explain-error')
    await expect(errors.first()).toContainText('请输入用户名')
    await expect(errors.nth(1)).toContainText('请输入密码')
  })

  test('登录按钮在提交时应显示加载状态', async ({ page }) => {
    // 开始登录
    await loginPage.usernameInput.fill('admin')
    await loginPage.passwordInput.fill('admin123')

    // 点击登录后立即检查加载状态
    await loginPage.submitButton.click()

    // 验证按钮有 loading class（Ant Design 使用 class 而不是 attribute）
    await expect(loginPage.submitButton).toHaveClass(/ant-btn-loading/, { timeout: 2000 })
  })
})