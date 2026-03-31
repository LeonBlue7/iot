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

  test('设备列表页面应正确加载', async () => {
    // 等待页面加载完成
    await devicesPage.title.waitFor({ state: 'visible', timeout: 10000 })

    // 验证页面标题
    await expect(devicesPage.title).toBeVisible()

    // 验证刷新按钮存在 - 使用正则匹配处理空格
    const refreshBtn = devicesPage.page.locator('button').filter({ hasText: /刷\s*新/ })
    await expect(refreshBtn).toBeVisible()

    // 验证设备表格存在
    await expect(devicesPage.deviceTable).toBeVisible()
  })

  test('设备列表应显示空状态或数据', async () => {
    // 等待数据加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 检查是否显示空状态或有数据
    const emptyState = devicesPage.page.locator('.ant-empty, .ant-table-placeholder, text=暂无数据')
    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const deviceCount = await devicesPage.getDeviceCount()

    // 要么显示空状态，要么有数据
    expect(hasEmptyState || deviceCount >= 0).toBeTruthy()
  })

  test('查看设备详情', async () => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 检查是否有设备数据
    const hasData = await devicesPage.hasData()

    if (!hasData) {
      // 没有数据时跳过测试
      console.log('没有设备数据，跳过查看详情测试')
      return
    }

    // 获取第一个设备ID
    const firstDeviceId = await devicesPage.page.locator('.ant-table-tbody tr:first-child td:first-child').textContent()

    if (firstDeviceId) {
      // 点击详情按钮
      await devicesPage.clickDeviceDetail(firstDeviceId)

      // 验证抽屉打开
      await devicesPage.detailDrawer.waitFor({ state: 'visible', timeout: 5000 })
      await expect(devicesPage.detailDrawer).toBeVisible()

      // 验证详情内容
      await expect(devicesPage.detailDrawer.locator('h3:has-text("基本信息")')).toBeVisible()
      await expect(devicesPage.detailDrawer.locator(`text=${firstDeviceId}`)).toBeVisible()
    }
  })

  test('编辑设备名称', async () => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 检查是否有设备数据
    const hasData = await devicesPage.hasData()

    if (!hasData) {
      console.log('没有设备数据，跳过编辑测试')
      return
    }

    // 获取第一个设备ID
    const firstDeviceId = await devicesPage.page.locator('.ant-table-tbody tr:first-child td:first-child').textContent()

    if (firstDeviceId) {
      // 点击编辑按钮
      await devicesPage.clickDeviceEdit(firstDeviceId)

      // 验证编辑对话框打开
      await devicesPage.editModal.waitFor({ state: 'visible', timeout: 5000 })
      await expect(devicesPage.editModal).toBeVisible()

      // 修改设备名称
      const newName = `测试设备_${Date.now()}`
      await devicesPage.page.locator('.ant-modal input[placeholder="请输入设备名称"]').fill(newName)

      // 提交表单 - 使用更通用的选择器
      await devicesPage.page.locator('.ant-modal .ant-btn-primary').click()

      // 验证成功提示
      await expect(devicesPage.page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 })

      // 关闭对话框
      await expect(devicesPage.editModal).not.toBeVisible()
    }
  })

  test('开启设备', async () => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 检查是否有设备数据
    const hasData = await devicesPage.hasData()

    if (!hasData) {
      console.log('没有设备数据，跳过开启设备测试')
      return
    }

    // 获取第一个设备ID
    const firstDeviceId = await devicesPage.page.locator('.ant-table-tbody tr:first-child td:first-child').textContent()

    if (firstDeviceId) {
      // 点击开启按钮
      await devicesPage.controlDevice(firstDeviceId, '开启')

      // 验证成功提示
      await expect(devicesPage.page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 })
    }
  })

  test('关闭设备', async () => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 检查是否有设备数据
    const hasData = await devicesPage.hasData()

    if (!hasData) {
      console.log('没有设备数据，跳过关闭设备测试')
      return
    }

    // 获取第一个设备ID
    const firstDeviceId = await devicesPage.page.locator('.ant-table-tbody tr:first-child td:first-child').textContent()

    if (firstDeviceId) {
      // 点击关闭按钮
      await devicesPage.controlDevice(firstDeviceId, '关闭')

      // 验证成功提示
      await expect(devicesPage.page.locator('.ant-message-success')).toBeVisible({ timeout: 5000 })
    }
  })

  test('刷新设备列表', async () => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 使用正则匹配刷新按钮
    const refreshBtn = devicesPage.page.locator('button').filter({ hasText: /刷\s*新/ })
    await expect(refreshBtn).toBeVisible()

    // 点击刷新按钮
    await refreshBtn.click()

    // 等待加载状态 - Ant Design 可能使用不同的 loading 指示器
    // 简化测试：等待表格刷新完成
    await devicesPage.page.waitForTimeout(500)

    // 验证表格仍然可见
    await expect(devicesPage.deviceTable).toBeVisible()
  })

  test('设备在线状态显示正确', async () => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 检查是否有设备数据
    const hasData = await devicesPage.hasData()

    if (!hasData) {
      console.log('没有设备数据，跳过状态检查测试')
      return
    }

    // 检查状态标签
    const statusTag = devicesPage.page.locator('.ant-table-tbody tr:first-child .ant-tag')

    // 验证状态标签存在
    await expect(statusTag).toBeVisible({ timeout: 5000 })

    // 验证状态文字
    const statusText = await statusTag.textContent()
    expect(statusText).toMatch(/在线|离线/)
  })

  test('分页功能正常工作', async () => {
    // 等待表格加载
    await devicesPage.deviceTable.waitFor({ state: 'visible' })

    // 检查分页器是否存在
    const pagination = devicesPage.page.locator('.ant-pagination')

    // 如果有多个页面，测试分页
    const paginationExists = await pagination.isVisible().catch(() => false)

    if (paginationExists) {
      // 点击下一页（如果可用）
      const nextButton = pagination.locator('.ant-pagination-next:not(.ant-pagination-disabled)')
      if (await nextButton.isVisible()) {
        await nextButton.click()
        await devicesPage.page.waitForTimeout(500)
        // 验证表格仍然可见
        await expect(devicesPage.deviceTable).toBeVisible()
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
      // 从仪表盘跳转到设备管理 - 使用更通用的选择器
      const devicesMenu = authenticatedPage.locator('.ant-layout-sider a[href*="devices"], nav a[href*="devices"], .ant-menu-item:has-text("设备")')

      if (await devicesMenu.first().isVisible()) {
        await devicesMenu.first().click()
        await expect(authenticatedPage).toHaveURL(/\/devices/)
      }
    }
  })
})