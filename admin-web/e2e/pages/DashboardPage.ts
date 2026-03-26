import type { Page, Locator } from '@playwright/test'

/**
 * 仪表盘页面 Page Object Model
 */
export class DashboardPage {
  readonly page: Page
  readonly title: Locator
  readonly totalDevicesStat: Locator
  readonly onlineDevicesStat: Locator
  readonly offlineDevicesStat: Locator
  readonly unacknowledgedAlarmsStat: Locator
  readonly recentAlarmsTable: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.locator('h1:has-text("仪表盘")')
    this.totalDevicesStat = page.locator('.ant-statistic').filter({ hasText: '设备总数' })
    this.onlineDevicesStat = page.locator('.ant-statistic').filter({ hasText: '在线设备' })
    this.offlineDevicesStat = page.locator('.ant-statistic').filter({ hasText: '离线设备' })
    this.unacknowledgedAlarmsStat = page.locator('.ant-statistic').filter({ hasText: '未处理告警' })
    this.recentAlarmsTable = page.locator('.ant-card:has-text("最近告警") .ant-table')
  }

  async goto() {
    await this.page.goto('/dashboard')
  }

  async getStatValue(statLocator: Locator): Promise<number> {
    const valueText = await statLocator.locator('.ant-statistic-content-value').textContent()
    return parseInt(valueText || '0', 10)
  }
}