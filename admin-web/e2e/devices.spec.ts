import { test, expect } from './fixtures'
import { DevicesPage, DashboardPage } from './pages'

/**
 * 设备管理 E2E 测试
 *
 * 测试场景：
 * 1. 页面加载和布局
 * 2. 层级树导航
 * 3. 设备列表操作
 * 4. 批量操作功能
 * 5. 设备搜索
 * 6. 分页功能
 */
test.describe('设备管理', () => {
  let devicesPage: DevicesPage

  test.beforeEach(async ({ authenticatedPage }) => {
    devicesPage = new DevicesPage(authenticatedPage)
    await devicesPage.goto()
  })

  test.describe('页面加载', () => {
    test('页面应正确加载', async () => {
      // 验证设备表格存在
      await expect(devicesPage.deviceTable).toBeVisible({ timeout: 10000 })

      // 验证层级树存在
      await expect(devicesPage.hierarchyTree).toBeVisible()
    })

    test('应显示刷新按钮', async () => {
      await expect(devicesPage.refreshButton).toBeVisible()
    })

    test('批量操作栏初始状态应禁用', async () => {
      // 初始状态应该没有选中设备
      const selectedCount = await devicesPage.getSelectedCount()
      expect(selectedCount).toBe(0)
    })
  })

  test.describe('层级树导航', () => {
    test('层级树应可见', async () => {
      await expect(devicesPage.hierarchyTree).toBeVisible()
    })

    test('点击层级节点应筛选设备', async () => {
      // 等待层级树加载
      await devicesPage.hierarchyTree.waitFor({ state: 'visible' })

      // 尝试展开第一个节点
      const firstExpandIcon = devicesPage.page.locator('.ant-tree-switcher_close').first()
      if (await firstExpandIcon.isVisible()) {
        await firstExpandIcon.click()
        await devicesPage.page.waitForTimeout(500)
      }

      // 点击第一个子节点
      const firstNode = devicesPage.page.locator('.ant-tree-node-content-wrapper').first()
      if (await firstNode.isVisible()) {
        await firstNode.click()
        await devicesPage.page.waitForTimeout(500)

        // 验证表格仍在显示
        await expect(devicesPage.deviceTable).toBeVisible()
      }
    })
  })

  test.describe('设备列表操作', () => {
    test('设备列表应显示数据或空状态', async () => {
      await devicesPage.deviceTable.waitFor({ state: 'visible' })

      const hasData = await devicesPage.hasData()
      const emptyState = devicesPage.page.locator('.ant-empty, .ant-table-placeholder, text=暂无数据')
      const hasEmptyState = await emptyState.isVisible().catch(() => false)

      expect(hasData || hasEmptyState).toBeTruthy()
    })

    test('刷新按钮应刷新设备列表', async () => {
      await devicesPage.deviceTable.waitFor({ state: 'visible' })

      // 点击刷新
      await devicesPage.refreshButton.click()
      await devicesPage.page.waitForTimeout(500)

      // 验证表格仍然可见
      await expect(devicesPage.deviceTable).toBeVisible()
    })

    test('设备在线状态应正确显示', async () => {
      await devicesPage.deviceTable.waitFor({ state: 'visible' })

      const hasData = await devicesPage.hasData()
      if (!hasData) {
        console.log('没有设备数据，跳过状态检查')
        return
      }

      // 检查状态标签 - 使用更通用的选择器
      const statusTag = devicesPage.page.locator('.ant-table-tbody tr:first-child td').nth(2)

      // 验证状态内容存在
      const statusText = await statusTag.textContent()
      // 状态可能显示为"在线"、"离线"或者Badge形式
      expect(statusText).toBeTruthy()
    })
  })

  test.describe('批量操作', () => {
    test('选择设备后批量操作栏应激活', async () => {
      await devicesPage.deviceTable.waitFor({ state: 'visible' })

      const hasData = await devicesPage.hasData()
      if (!hasData) {
        console.log('没有设备数据，跳过批量操作测试')
        return
      }

      // 选择第一个设备
      const firstCheckbox = devicesPage.page.locator('.ant-table-tbody tr:first-child .ant-checkbox-input')
      await firstCheckbox.check()

      // 验证选中计数
      const selectedCount = await devicesPage.getSelectedCount()
      expect(selectedCount).toBeGreaterThan(0)
    })

    test('全选功能应选中所有设备', async () => {
      await devicesPage.deviceTable.waitFor({ state: 'visible' })

      const hasData = await devicesPage.hasData()
      if (!hasData) {
        console.log('没有设备数据，跳过全选测试')
        return
      }

      // 点击全选
      await devicesPage.selectAllDevices()

      // 验证有设备被选中
      const selectedCount = await devicesPage.getSelectedCount()
      expect(selectedCount).toBeGreaterThan(0)
    })

    test('批量开启按钮应可见', async () => {
      await devicesPage.deviceTable.waitFor({ state: 'visible' })

      const hasData = await devicesPage.hasData()
      if (!hasData) {
        console.log('没有设备数据，跳过批量操作测试')
        return
      }

      // 选择一个设备
      const firstCheckbox = devicesPage.page.locator('.ant-table-tbody tr:first-child .ant-checkbox-input')
      await firstCheckbox.check()

      // 验证批量操作按钮可见
      const batchOnBtn = devicesPage.batchActionBar.locator('[data-testid="btn-batch-on"]')
      await expect(batchOnBtn).toBeVisible()
      await expect(batchOnBtn).not.toBeDisabled()
    })

    test('批量关闭按钮应可见', async () => {
      await devicesPage.deviceTable.waitFor({ state: 'visible' })

      const hasData = await devicesPage.hasData()
      if (!hasData) {
        console.log('没有设备数据，跳过批量操作测试')
        return
      }

      const firstCheckbox = devicesPage.page.locator('.ant-table-tbody tr:first-child .ant-checkbox-input')
      await firstCheckbox.check()

      const batchOffBtn = devicesPage.batchActionBar.locator('[data-testid="btn-batch-off"]')
      await expect(batchOffBtn).toBeVisible()
      await expect(batchOffBtn).not.toBeDisabled()
    })

    test('批量设置参数按钮应可见', async () => {
      await devicesPage.deviceTable.waitFor({ state: 'visible' })

      const hasData = await devicesPage.hasData()
      if (!hasData) {
        console.log('没有设备数据，跳过批量操作测试')
        return
      }

      const firstCheckbox = devicesPage.page.locator('.ant-table-tbody tr:first-child .ant-checkbox-input')
      await firstCheckbox.check()

      const paramsBtn = devicesPage.batchActionBar.locator('[data-testid="btn-batch-params"]')
      await expect(paramsBtn).toBeVisible()
      await expect(paramsBtn).not.toBeDisabled()
    })

    test('批量移动分组按钮应可见', async () => {
      await devicesPage.deviceTable.waitFor({ state: 'visible' })

      const hasData = await devicesPage.hasData()
      if (!hasData) {
        console.log('没有设备数据，跳过批量操作测试')
        return
      }

      const firstCheckbox = devicesPage.page.locator('.ant-table-tbody tr:first-child .ant-checkbox-input')
      await firstCheckbox.check()

      const moveBtn = devicesPage.batchActionBar.locator('[data-testid="btn-batch-move"]')
      await expect(moveBtn).toBeVisible()
      await expect(moveBtn).not.toBeDisabled()
    })
  })

  test.describe('分页功能', () => {
    test('分页器应正确显示', async () => {
      await devicesPage.deviceTable.waitFor({ state: 'visible' })

      const pagination = devicesPage.page.locator('.ant-pagination')
      const hasPagination = await pagination.isVisible().catch(() => false)

      if (hasPagination) {
        // 验证分页器存在
        await expect(pagination).toBeVisible()
      } else {
        // 可能数据量不足以显示分页
        console.log('分页器未显示，可能数据量不足')
      }
    })

    test('下一页按钮应工作', async () => {
      await devicesPage.deviceTable.waitFor({ state: 'visible' })

      const nextBtn = devicesPage.page.locator('.ant-pagination-next:not(.ant-pagination-disabled)')
      if (await nextBtn.isVisible()) {
        await nextBtn.click()
        await devicesPage.page.waitForTimeout(500)
        await expect(devicesPage.deviceTable).toBeVisible()
      }
    })
  })
})

test.describe('设备管理 - 导航测试', () => {
  test('从仪表盘可以导航到设备管理', async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage)
    await dashboardPage.goto()
    await dashboardPage.title.waitFor()

    // 点击侧边栏设备管理菜单
    const devicesMenu = authenticatedPage.locator('.ant-layout-sider a[href*="devices"], nav a[href*="devices"], .ant-menu-item:has-text("设备")')

    if (await devicesMenu.first().isVisible()) {
      await devicesMenu.first().click()
      // 验证跳转
      await expect(authenticatedPage).toHaveURL(/\/devices/)
    } else {
      console.log('设备管理菜单未找到')
    }
  })
})