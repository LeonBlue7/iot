import { test as base, Page, BrowserContext } from '@playwright/test'
import { TEST_USER } from './helpers/auth'

/**
 * 扩展的测试fixture，包含已认证的页面
 */
type TestFixtures = {
  authenticatedPage: Page
}

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page, context }, use) => {
    // 直接通过UI登录
    await page.goto('/login')

    // 等待页面加载完成
    await page.waitForLoadState('networkidle')

    // 等待登录表单可见
    await page.getByPlaceholder('用户名').waitFor({ timeout: 10000 })

    // 填写登录表单
    await page.getByPlaceholder('用户名').fill(TEST_USER.username)
    await page.getByPlaceholder('密码').fill(TEST_USER.password)

    // 点击登录按钮 - 使用正则匹配处理可能的空格
    const loginButton = page.locator('button').filter({ hasText: /登\s*录/ })
    await loginButton.click()

    // 等待登录成功 - 使用更灵活的等待条件
    // 等待 URL 变化或页面元素出现
    try {
      await page.waitForURL('**/dashboard', { timeout: 30000 })
    } catch {
      // 如果 URL 没有变化，检查是否已经在 dashboard
      const currentUrl = page.url()
      if (!currentUrl.includes('dashboard')) {
        // 检查是否有错误消息
        const errorMessage = await page.locator('.ant-message-error').textContent().catch(() => null)
        if (errorMessage) {
          throw new Error(`Login failed: ${errorMessage}`)
        }
        // 尝试再次点击登录按钮
        await loginButton.click()
        await page.waitForURL('**/dashboard', { timeout: 15000 })
      }
    }

    await use(page)
  },
})

export { expect } from '@playwright/test'