import { test as setup, expect } from '@playwright/test'

/**
 * 认证设置文件
 * 在运行测试前先登录并保存认证状态
 */

const AUTH_FILE = '.auth/user.json'

setup('认证', async ({ page }) => {
  // 访问登录页面
  await page.goto('/login')

  // 等待页面加载
  await expect(page.locator('h2:has-text("物联网管理系统")')).toBeVisible()

  // 输入凭证
  await page.locator('input[placeholder="用户名"]').fill('admin')
  await page.locator('input[placeholder="密码"]').fill('admin123')

  // 点击登录
  await page.locator('button:has-text("登录")').click()

  // 等待登录成功跳转
  await page.waitForURL('**/dashboard', { timeout: 10000 })

  // 验证已登录
  await expect(page.locator('h1:has-text("仪表盘")')).toBeVisible()

  // 保存认证状态
  await page.context().storageState({ path: AUTH_FILE })
})