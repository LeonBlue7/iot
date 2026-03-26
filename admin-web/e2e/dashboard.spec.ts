import { test, expect } from './fixtures'
import { DashboardPage } from './pages'

/**
 * 仪表盘 E2E 测试
 *
 * 测试场景：
 * 1. 仪表盘页面加载
 * 2. 统计数据显示
 * 3. 最近告警列表
 */
test.describe('仪表盘', () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage)
    await dashboardPage.goto()
  })

  test('仪表盘页面应正确加载', async () => {
    // 验证页面标题
    await expect(dashboardPage.title).toBeVisible()

    // 验证四个统计卡片
    await expect(dashboardPage.totalDevicesStat).toBeVisible()
    await expect(dashboardPage.onlineDevicesStat).toBeVisible()
    await expect(dashboardPage.offlineDevicesStat).toBeVisible()
    await expect(dashboardPage.unacknowledgedAlarmsStat).toBeVisible()
  })

  test('设备总数统计显示正确', async () => {
    // 获取设备总数
    const totalDevices = await dashboardPage.getStatValue(dashboardPage.totalDevicesStat)

    // 获取在线设备数
    const onlineDevices = await dashboardPage.getStatValue(dashboardPage.onlineDevicesStat)

    // 获取离线设备数
    const offlineDevices = await dashboardPage.getStatValue(dashboardPage.offlineDevicesStat)

    // 验证在线+离线=总数
    expect(onlineDevices + offlineDevices).toBe(totalDevices)
  })

  test('未处理告警数显示正确', async () => {
    // 获取未处理告警数
    const unacknowledgedAlarms = await dashboardPage.getStatValue(dashboardPage.unacknowledgedAlarmsStat)

    // 验证是非负数
    expect(unacknowledgedAlarms).toBeGreaterThanOrEqual(0)
  })

  test('最近告警表格显示正确', async () => {
    // 检查最近告警卡片
    const recentAlarmsCard = await dashboardPage.recentAlarmsTable.isVisible().catch(() => false)

    if (recentAlarmsCard) {
      // 如果有数据，验证表格结构
      const table = dashboardPage.page.locator('.ant-card:has-text("最近告警") .ant-table')
      if (await table.isVisible()) {
        // 验证表头
        await expect(table.locator('th:has-text("设备 ID")')).toBeVisible()
        await expect(table.locator('th:has-text("告警类型")')).toBeVisible()
        await expect(table.locator('th:has-text("状态")')).toBeVisible()
      }
    } else {
      // 如果没有数据，验证空状态
      const noAlarmsAlert = dashboardPage.page.locator('.ant-alert:has-text("暂无告警记录")')
      await expect(noAlarmsAlert).toBeVisible()
    }
  })

  test('统计卡片图标正确显示', async ({ page }) => {
    // 验证设备总数图标
    await expect(page.locator('.ant-statistic').filter({ hasText: '设备总数' }).locator('.anticon-mobile')).toBeVisible()

    // 验证在线设备图标
    await expect(page.locator('.ant-statistic').filter({ hasText: '在线设备' }).locator('.anticon-check-circle')).toBeVisible()

    // 验证离线设备图标
    await expect(page.locator('.ant-statistic').filter({ hasText: '离线设备' }).locator('.anticon-close-circle')).toBeVisible()

    // 验证未处理告警图标
    await expect(page.locator('.ant-statistic').filter({ hasText: '未处理告警' }).locator('.anticon-warning')).toBeVisible()
  })

  test('响应式布局正常', async ({ page }) => {
    // 测试移动端布局
    await page.setViewportSize({ width: 375, height: 667 })

    // 验证统计卡片在小屏幕上仍然可见
    await expect(dashboardPage.totalDevicesStat).toBeVisible()

    // 恢复桌面布局
    await page.setViewportSize({ width: 1280, height: 720 })

    // 验证统计卡片正常显示
    await expect(dashboardPage.totalDevicesStat).toBeVisible()
  })
})