import type { Page, Locator } from '@playwright/test'

/**
 * 设备管理页面 Page Object Model
 */
export class DevicesPage {
  readonly page: Page
  readonly title: Locator
  readonly refreshButton: Locator
  readonly deviceTable: Locator
  readonly deviceRows: Locator
  readonly detailDrawer: Locator
  readonly editModal: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.locator('h1:has-text("设备管理")')
    this.refreshButton = page.locator('button:has-text("刷新")')
    this.deviceTable = page.locator('.ant-table')
    this.deviceRows = page.locator('.ant-table-tbody tr')
    this.detailDrawer = page.locator('.ant-drawer:has-text("设备详情")')
    this.editModal = page.locator('.ant-modal:has-text("编辑设备信息")')
  }

  async goto() {
    await this.page.goto('/devices')
  }

  async clickDeviceDetail(deviceId: string) {
    await this.page
      .locator(`tr:has-text("${deviceId}") button:has-text("详情")`)
      .click()
  }

  async clickDeviceEdit(deviceId: string) {
    await this.page
      .locator(`tr:has-text("${deviceId}") button:has-text("编辑")`)
      .click()
  }

  async controlDevice(deviceId: string, action: '开启' | '关闭') {
    await this.page
      .locator(`tr:has-text("${deviceId}") button:has-text("${action}")`)
      .click()
  }

  async getDeviceCount(): Promise<number> {
    return await this.deviceRows.count()
  }

  async isDeviceOnline(deviceId: string): Promise<boolean> {
    const statusTag = await this.page
      .locator(`tr:has-text("${deviceId}") .ant-tag`)
      .textContent()
    return statusTag?.includes('在线') || false
  }
}