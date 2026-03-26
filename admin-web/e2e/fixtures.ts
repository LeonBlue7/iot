import { test as base, Page } from '@playwright/test'
import { TEST_USER } from './helpers/auth'

/**
 * 扩展的测试fixture，包含已认证的页面
 */
type TestFixtures = {
  authenticatedPage: Page
}

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // 直接通过UI登录
    await page.goto('/login')

    // 等待页面加载
    await page.getByRole('heading', { name: /物联网管理系统/ }).waitFor({ timeout: 10000 })

    // 填写登录表单
    await page.getByPlaceholder('用户名').fill(TEST_USER.username)
    await page.getByPlaceholder('密码').fill(TEST_USER.password)

    // 点击提交按钮
    await page.locator('button[type="submit"], button.ant-btn-primary').first().click()

    // 等待登录成功跳转
    await page.waitForURL('**/dashboard', { timeout: 15000 })

    await use(page)
  },
})

export { expect } from '@playwright/test'