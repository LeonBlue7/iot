import type { Page, Locator } from '@playwright/test'

/**
 * 告警管理页面 Page Object Model
 */
export class AlarmsPage {
  readonly page: Page
  readonly title: Locator
  readonly alarmTable: Locator
  readonly alarmRows: Locator
  readonly acknowledgeButtons: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.locator('h1:has-text("告警管理")')
    this.alarmTable = page.locator('.ant-table')
    this.alarmRows = page.locator('.ant-table-tbody tr')
    this.acknowledgeButtons = page.locator('button:has-text("确认")')
  }

  async goto() {
    await this.page.goto('/alarms')
  }

  async acknowledgeAlarm(alarmId: number) {
    await this.page
      .locator(`tr:has-text("${alarmId}") button:has-text("确认")`)
      .click()
    // 确认对话框
    await this.page.locator('.ant-modal-confirm button:has-text("确定")').click()
  }

  async getAlarmCount(): Promise<number> {
    return await this.alarmRows.count()
  }

  async getUnacknowledgedCount(): Promise<number> {
    return await this.acknowledgeButtons.count()
  }
}