// admin-web/e2e/groups.test.ts
import { test, expect } from '@playwright/test'

test.describe('分组管理', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login')
    await page.getByPlaceholder('用户名').fill('admin')
    await page.getByPlaceholder('密码').fill('admin123')
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })

    // 导航到分组管理页面
    await page.getByRole('menu').getByText('分组管理').click()
    await page.waitForURL(/\/groups/, { timeout: 5000 })
  })

  test('应该显示分组管理页面', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '分组管理' })).toBeVisible()
    await expect(page.getByRole('button', { name: '新建分组' })).toBeVisible()
  })

  test('应该显示分组列表', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('table', { timeout: 5000 })

    // 验证表格标题
    await expect(page.getByRole('columnheader', { name: '分组名称' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: '设备数量' })).toBeVisible()
  })

  test('应该创建新分组', async ({ page }) => {
    const groupName = `Test_Group_${Date.now()}`

    // 点击新建按钮
    await page.getByRole('button', { name: '新建分组' }).click()

    // 填写表单
    await page.getByLabel('分组名称').fill(groupName)
    await page.getByLabel('描述').fill('这是一个测试分组')

    // 提交
    await page.getByRole('button', { name: '确定' }).click()

    // 验证成功消息
    await expect(page.getByText('创建成功')).toBeVisible()

    // 验证新分组出现在列表中
    await expect(page.getByText(groupName)).toBeVisible()
  })

  test('应该编辑分组', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('table tbody tr', { timeout: 5000 })

    // 点击第一个编辑按钮
    const editButtons = page.getByRole('button', { name: '编辑' })
    const count = await editButtons.count()

    if (count > 0) {
      await editButtons.first().click()

      // 修改名称
      const nameInput = page.getByLabel('分组名称')
      await nameInput.fill('Updated_Group_Name')

      // 提交
      await page.getByRole('button', { name: '确定' }).click()

      // 验证成功
      await expect(page.getByText('更新成功')).toBeVisible()
    }
  })

  test('应该禁止删除有设备的分组', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('table tbody tr', { timeout: 5000 })

    // 检查是否有带设备的分组
    const rows = page.locator('table tbody tr')
    const count = await rows.count()

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i)
      const deviceCount = await row.locator('td').nth(4).textContent()

      if (deviceCount && parseInt(deviceCount) > 0) {
        // 删除按钮应该是禁用状态
        const deleteButton = row.getByRole('button', { name: '删除' })
        await expect(deleteButton).toBeDisabled()
        break
      }
    }
  })
})