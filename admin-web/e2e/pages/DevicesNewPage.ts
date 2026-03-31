import type { Page, Locator } from '@playwright/test'

/**
 * 新版设备管理页面 Page Object Model
 * 支持层级树、批量操作、设备搜索
 */
export class DevicesNewPage {
  readonly page: Page
  readonly title: Locator
  readonly refreshButton: Locator
  readonly deviceTable: Locator
  readonly deviceRows: Locator
  readonly hierarchyTree: Locator
  readonly batchActionBar: Locator
  readonly searchPanel: Locator
  readonly paramsModal: Locator
  readonly moveModal: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.locator('h1, .ant-page-header-heading-title')
    this.refreshButton = page.locator('button').filter({ hasText: /刷新|Refresh/i })
    this.deviceTable = page.locator('.ant-table')
    this.deviceRows = page.locator('.ant-table-tbody tr:not(:has-text("暂无数据"))')

    // 层级树
    this.hierarchyTree = page.locator('[data-testid="hierarchy-tree"], .ant-tree')

    // 批量操作栏
    this.batchActionBar = page.locator('[data-testid="batch-action-bar"]')

    // 搜索面板
    this.searchPanel = page.locator('[data-testid="device-search-panel"], .device-search-panel')

    // 弹窗
    this.paramsModal = page.locator('.ant-modal:has-text("批量设置参数")')
    this.moveModal = page.locator('.ant-modal:has-text("移动到分组")')
  }

  async goto() {
    await this.page.goto('/devices-new')
    await this.page.waitForLoadState('networkidle')
  }

  async hasData(): Promise<boolean> {
    const count = await this.deviceRows.count()
    return count > 0
  }

  async getDeviceCount(): Promise<number> {
    return await this.deviceRows.count()
  }

  // 层级树操作
  async selectHierarchyNode(level: 'customer' | 'zone' | 'group', name: string) {
    const node = this.page.locator(`.ant-tree-node-content-wrapper:has-text("${name}")`)
    await node.click()
    await this.page.waitForTimeout(500)
  }

  async expandHierarchyNode(name: string) {
    const expandIcon = this.page.locator(`.ant-tree-treenode:has-text("${name}") .ant-tree-switcher_close`)
    if (await expandIcon.isVisible()) {
      await expandIcon.click()
      await this.page.waitForTimeout(300)
    }
  }

  // 批量操作
  async selectDevice(deviceId: string) {
    const checkbox = this.page.locator(`tr:has-text("${deviceId}") .ant-checkbox-input`)
    await checkbox.check()
  }

  async selectAllDevices() {
    const selectAll = this.page.locator('.ant-table-thead .ant-checkbox-input')
    await selectAll.check()
  }

  async getSelectedCount(): Promise<number> {
    const countText = await this.batchActionBar.locator('[data-testid="selected-count"]').textContent()
    const match = countText?.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  async batchTurnOn() {
    await this.batchActionBar.locator('[data-testid="btn-batch-on"]').click()
  }

  async batchTurnOff() {
    await this.batchActionBar.locator('[data-testid="btn-batch-off"]').click()
  }

  async batchReset() {
    await this.batchActionBar.locator('[data-testid="btn-batch-reset"]').click()
  }

  async batchMove() {
    await this.batchActionBar.locator('[data-testid="btn-batch-move"]').click()
  }

  async batchParams() {
    await this.batchActionBar.locator('[data-testid="btn-batch-params"]').click()
  }

  async batchEnable() {
    await this.batchActionBar.locator('[data-testid="btn-batch-enable"]').click()
  }

  async batchDisable() {
    await this.batchActionBar.locator('[data-testid="btn-batch-disable"]').click()
  }

  async batchDelete() {
    await this.batchActionBar.locator('[data-testid="btn-batch-delete"]').click()
  }

  // 确认操作
  async confirmAction() {
    await this.page.locator('.ant-modal-confirm .ant-btn-primary, .ant-modal .ant-btn-primary').click()
  }

  async cancelAction() {
    await this.page.locator('.ant-modal-confirm .ant-btn-default, .ant-modal .ant-btn-default').first().click()
  }

  // 搜索操作
  async searchByDeviceId(deviceId: string) {
    const input = this.searchPanel.locator('input[placeholder*="设备ID"], input[placeholder*="Device ID"]')
    await input.fill(deviceId)
    await this.page.keyboard.press('Enter')
    await this.page.waitForTimeout(500)
  }

  async clearSearch() {
    const clearBtn = this.searchPanel.locator('button:has-text("重置"), button:has-text("Clear")')
    await clearBtn.click()
    await this.page.waitForTimeout(500)
  }

  // 分页操作
  async goToNextPage() {
    const nextBtn = this.page.locator('.ant-pagination-next:not(.ant-pagination-disabled)')
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      await this.page.waitForTimeout(500)
    }
  }

  async goToPrevPage() {
    const prevBtn = this.page.locator('.ant-pagination-prev:not(.ant-pagination-disabled)')
    if (await prevBtn.isVisible()) {
      await prevBtn.click()
      await this.page.waitForTimeout(500)
    }
  }

  async getCurrentPage(): Promise<number> {
    const activePage = this.page.locator('.ant-pagination-item-active')
    const text = await activePage.textContent()
    return text ? parseInt(text, 10) : 1
  }

  async getTotalCount(): Promise<number> {
    const totalText = await this.page.locator('.ant-pagination-total-text').textContent()
    const match = totalText?.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }
}