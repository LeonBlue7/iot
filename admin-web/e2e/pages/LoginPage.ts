import type { Page, Locator } from '@playwright/test'

/**
 * 登录页面 Page Object Model
 */
export class LoginPage {
  readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly title: Locator

  constructor(page: Page) {
    this.page = page
    // 使用更灵活的选择器
    this.usernameInput = page.getByPlaceholder('用户名')
    this.passwordInput = page.getByPlaceholder('密码')
    // Ant Design 按钮文本可能在 span 内，使用多种选择器
    this.submitButton = page.locator('button[type="submit"], button.ant-btn-primary').first()
    this.errorMessage = page.locator('.ant-message')
    this.title = page.getByRole('heading', { name: /物联网管理系统/ })
  }

  async goto() {
    await this.page.goto('/login')
    // 等待页面加载完成
    await this.title.waitFor({ state: 'visible', timeout: 10000 })
    // 额外等待表单渲染
    await this.usernameInput.waitFor({ state: 'visible', timeout: 5000 })
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async expectLoginSuccess() {
    await this.page.waitForURL('**/dashboard', { timeout: 15000 })
  }

  async expectLoginError() {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 10000 })
  }
}