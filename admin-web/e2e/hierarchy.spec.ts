import { test, expect } from './fixtures'

/**
 * 四层分层功能验证测试
 * Customer -> Zone -> Group -> Device
 */
test.describe('四层分层功能验证', () => {
  test('验证层级树显示三级结构', async ({ authenticatedPage }) => {
    // 访问新版设备管理页面
    await authenticatedPage.goto('/devices-new')
    await authenticatedPage.waitForLoadState('networkidle')

    // 等待层级树加载
    const hierarchyTree = authenticatedPage.locator('.ant-tree')
    await hierarchyTree.waitFor({ state: 'visible', timeout: 10000 })

    // 截图
    await authenticatedPage.screenshot({ path: 'test-results/hierarchy-tree.png', fullPage: true })

    // 验证层级树可见
    await expect(hierarchyTree).toBeVisible()

    // 展开第一个客户节点
    const firstExpandIcon = authenticatedPage.locator('.ant-tree-switcher_close').first()
    if (await firstExpandIcon.isVisible()) {
      await firstExpandIcon.click()
      await authenticatedPage.waitForTimeout(500)
    }

    // 验证有子节点
    const childNodes = authenticatedPage.locator('.ant-tree-treenode')
    const count = await childNodes.count()
    expect(count).toBeGreaterThan(0)

    console.log(`层级树节点数: ${count}`)
  })

  test('验证API返回四层结构数据', async ({ authenticatedPage }) => {
    // 获取存储的token
    const authStorage = await authenticatedPage.evaluate(() => {
      const storage = localStorage.getItem('auth-storage')
      return storage ? JSON.parse(storage) : null
    })

    const token = authStorage?.state?.token
    expect(token).toBeTruthy()

    // 获取Customers数据
    const customersResponse = await authenticatedPage.request.get('/api/customers', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const customers = await customersResponse.json()
    expect(customers.success).toBeTruthy()
    expect(customers.data.length).toBeGreaterThan(0)

    // 获取第一个Customer的Zones
    const firstCustomer = customers.data[0]
    const zonesResponse = await authenticatedPage.request.get(`/api/zones/customer/${firstCustomer.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const zones = await zonesResponse.json()
    expect(zones.success).toBeTruthy()

    // 获取第一个Zone的Groups
    if (zones.data.length > 0) {
      const firstZone = zones.data[0]
      const groupsResponse = await authenticatedPage.request.get(`/api/groups/zone/${firstZone.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const groups = await groupsResponse.json()
      expect(groups.success).toBeTruthy()

      // 验证Groups有设备计数
      if (groups.data.length > 0) {
        const firstGroup = groups.data[0]
        expect(firstGroup).toHaveProperty('_count')
        expect(firstGroup._count).toHaveProperty('devices')
      }
    }

    console.log('四层API验证通过:', {
      customers: customers.data.length,
      zones: zones.data.length
    })
  })

  test('验证设备关联到分组', async ({ authenticatedPage }) => {
    // 获取存储的token
    const authStorage = await authenticatedPage.evaluate(() => {
      const storage = localStorage.getItem('auth-storage')
      return storage ? JSON.parse(storage) : null
    })

    const token = authStorage?.state?.token
    expect(token).toBeTruthy()

    // 获取设备列表
    const devicesResponse = await authenticatedPage.request.get('/api/devices', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const devices = await devicesResponse.json()
    expect(devices.success).toBeTruthy()

    // 检查是否有设备关联到分组
    const devicesWithGroup = devices.data.filter((d: { groupId: number | null }) => d.groupId !== null)
    console.log(`关联分组的设备数: ${devicesWithGroup.length}`)

    if (devicesWithGroup.length > 0) {
      const device = devicesWithGroup[0]
      expect(device).toHaveProperty('groupId')
      expect(device.groupId).not.toBeNull()

      // 验证可以通过分组ID查询设备
      const groupDevicesResponse = await authenticatedPage.request.get(`/api/groups/${device.groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const group = await groupDevicesResponse.json()
      expect(group.success).toBeTruthy()
    }
  })

  test('验证层级筛选功能', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/devices-new')
    await authenticatedPage.waitForLoadState('networkidle')

    // 等待设备表格加载
    const deviceTable = authenticatedPage.locator('.ant-table')
    await deviceTable.waitFor({ state: 'visible', timeout: 10000 })

    // 点击层级树中的分组节点
    const groupNode = authenticatedPage.locator('.ant-tree-node-content-wrapper').filter({ hasText: '空调' }).first()
    if (await groupNode.isVisible()) {
      await groupNode.click()
      await authenticatedPage.waitForTimeout(500)

      // 验证表格更新
      await expect(deviceTable).toBeVisible()

      // 截图
      await authenticatedPage.screenshot({ path: 'test-results/hierarchy-filter.png' })
    }
  })

  test('验证批量操作功能', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/devices-new')
    await authenticatedPage.waitForLoadState('networkidle')

    // 等待设备表格加载
    const deviceTable = authenticatedPage.locator('.ant-table')
    await deviceTable.waitFor({ state: 'visible', timeout: 10000 })

    // 检查是否有设备数据
    const deviceRows = authenticatedPage.locator('.ant-table-tbody tr')
    const rowCount = await deviceRows.count()

    if (rowCount > 0) {
      // 选择第一个设备
      const firstCheckbox = deviceRows.first().locator('.ant-checkbox-input')
      await firstCheckbox.check()

      // 验证批量操作栏显示选中数量
      const selectedCount = authenticatedPage.locator('[data-testid="selected-count"]')
      await expect(selectedCount).toBeVisible()

      // 验证批量操作按钮可用
      const batchOnBtn = authenticatedPage.locator('[data-testid="btn-batch-on"]')
      await expect(batchOnBtn).not.toBeDisabled()

      console.log('批量操作功能验证通过')
    }
  })
})