import { test, expect } from './fixtures'
import { DevicesPage, DashboardPage } from './pages'

/**
 * 设备管理 E2E 测试
 *
 * 测试场景：
 * 1. 设备列表页面加载
 * 2. 查看设备详情
 * 3. 编辑设备信息
 * 4. 设备控制（开启/关闭）
 * 5. 刷新设备列表
 */
test.describe('设备管理', () => {
  let devicesPage: DevicesPage

  test.beforeEach(async ({ authenticatedPage }) => {
    devicesPage = new DevicesPage(authenticatedPage)
    await devicesPage.goto()
  })

  test('设备列表页面应正确加载', async ({ page }) => {
    // 验证页面标题
    await expect(devicesPage.title).toBeVisible()

    // 验证刷新按钮存在
    await expect(devicesPage.refreshButton).toBeVisible()

    // 验证设备表格存在
    await expect(devicesPage.deviceTable).toBeVisible()
  })

  test('设备列表应显示设备数据', async () => {
    // 等待数据加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 验证有设备数据
    const deviceCount = await devicesPage.getDeviceCount()
    expect(deviceCount).toBeGreaterThan(0)
  })

  test('查看设备详情', async ({ page }) => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 获取第一个设备ID
    const firstDeviceId = await page.locator('.ant-table-tbody tr:first-child td:first-child').textContent()

    if (firstDeviceId) {
      // 点击详情按钮
      await devicesPage.clickDeviceDetail(firstDeviceId)

      // 验证抽屉打开
      await expect(devicesPage.detailDrawer).toBeVisible()

      // 验证详情内容
      await expect(devicesPage.detailDrawer.locator('h3:has-text("基本信息")')).toBeVisible()
      await expect(devicesPage.detailDrawer.locator(`text=${firstDeviceId}`)).toBeVisible()
    }
  })

  test('编辑设备名称', async ({ page }) => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 获取第一个设备ID
    const firstDeviceId = await page.locator('.ant-table-tbody tr:first-child td:first-child').textContent()

    if (firstDeviceId) {
      // 点击编辑按钮
      await devicesPage.clickDeviceEdit(firstDeviceId)

      // 验证编辑对话框打开
      await expect(devicesPage.editModal).toBeVisible()

      // 修改设备名称
      const newName = `测试设备_${Date.now()}`
      await page.locator('.ant-modal input[placeholder="请输入设备名称"]').fill(newName)

      // 提交表单
      await page.locator('.ant-modal button:has-text("确定")').click()

      // 验证成功提示
      await expect(page.locator('.ant-message-success')).toBeVisible()

      // 关闭对话框
      await expect(devicesPage.editModal).not.toBeVisible()
    }
  })

  test('开启设备', async ({ page }) => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 获取第一个设备ID
    const firstDeviceId = await page.locator('.ant-table-tbody tr:first-child td:first-child').textContent()

    if (firstDeviceId) {
      // 点击开启按钮
      await devicesPage.controlDevice(firstDeviceId, '开启')

      // 验证成功提示
      await expect(page.locator('.ant-message-success')).toBeVisible()
    }
  })

  test('关闭设备', async ({ page }) => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 获取第一个设备ID
    const firstDeviceId = await page.locator('.ant-table-tbody tr:first-child td:first-child').textContent()

    if (firstDeviceId) {
      // 点击关闭按钮
      await devicesPage.controlDevice(firstDeviceId, '关闭')

      // 验证成功提示
      await expect(page.locator('.ant-message-success')).toBeVisible()
    }
  })

  test('刷新设备列表', async ({ page }) => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 记录刷新前的设备数量
    const countBefore = await devicesPage.getDeviceCount()

    // 点击刷新按钮
    await devicesPage.refreshButton.click()

    // 验证加载状态
    await expect(devicesPage.refreshButton).toHaveAttribute('loading', 'true', { timeout: 1000 })

    // 等待加载完成
    await expect(devicesPage.refreshButton).not.toHaveAttribute('loading', 'true', { timeout: 5000 })

    // 验证数据已刷新
    const countAfter = await devicesPage.getDeviceCount()
    expect(countAfter).toBe(countBefore)
  })

  test('设备在线状态显示正确', async ({ page }) => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 检查状态标签
    const statusTag = page.locator('.ant-table-tbody tr:first-child .ant-tag')

    // 验证状态标签存在
    await expect(statusTag).toBeVisible()

    // 验证状态文字
    const statusText = await statusTag.textContent()
    expect(statusText).toMatch(/在线|离线/)
  })

  test('分页功能正常工作', async ({ page }) => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 检查分页器是否存在
    const pagination = page.locator('.ant-pagination')

    // 如果有多个页面，测试分页
    const paginationExists = await pagination.isVisible().catch(() => false)

    if (paginationExists) {
      // 获取总条数
      const totalText = await pagination.locator('.ant-pagination-total-text').textContent()
      expect(totalText).toMatch(/\d+ 条/)

      // 点击下一页
      const nextButton = pagination.locator('.ant-pagination-next:not(.ant-pagination-disabled)')
      if (await nextButton.isVisible()) {
        await nextButton.click()
        // 验证URL参数变化
        await expect(page).toHaveURL(/page=2/)
      }
    }
  })
})

test.describe('设备管理 - 从仪表盘导航', () => {
  test('从仪表盘点击设备可跳转到设备详情', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage)
    await dashboardPage.goto()

    // 等待数据加载
    await dashboardPage.title.waitFor()

    // 如果有设备，验证导航
    const totalDevices = await dashboardPage.getStatValue(dashboardPage.totalDevicesStat)
    if (totalDevices > 0) {
      // 从仪表盘跳转到设备管理
      await authenticatedPage.locator('a:has-text("设备管理"), nav a[href="/devices"]').click()
      await expect(authenticatedPage).toHaveURL(/\/devices/)
    }
  })
})