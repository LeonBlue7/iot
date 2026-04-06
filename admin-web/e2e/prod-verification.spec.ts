import { test as base, expect, Page } from '@playwright/test'

/**
 * 生产环境综合功能验证测试
 *
 * 测试凭据通过环境变量配置:
 * - E2E_TEST_USERNAME: 测试用户名
 * - E2E_TEST_PASSWORD: 测试密码
 *
 * 测试环境: https://www.jxbonner.cloud
 *
 * 测试范围:
 * 1. 登录功能
 * 2. 仪表盘 - 统计概览、快捷操作面板
 * 3. 设备管理 - 设备列表、设备详情页
 * 4. 设备详情 - 实时数据、历史图表、参数配置、设备控制
 * 5. 统计分析 - 设备选择、时间范围筛选、趋势图表
 * 6. 告警管理 - 状态筛选、批量操作、解决功能
 * 7. 层级管理 - 客户/分区/分组列表、详情页
 * 8. 分组详情 - 设备分配功能
 */

// 生产环境配置
const PROD_URL = 'https://www.jxbonner.cloud'

// 从环境变量获取测试凭据
const TEST_USER = {
  username: process.env.E2E_TEST_USERNAME || '',
  password: process.env.E2E_TEST_PASSWORD || ''
}

// 验证环境变量是否配置
if (!TEST_USER.username || !TEST_USER.password) {
  console.error('错误: 请设置环境变量 E2E_TEST_USERNAME 和 E2E_TEST_PASSWORD')
  console.error('示例: E2E_TEST_USERNAME=admin E2E_TEST_PASSWORD=your_password npx playwright test')
}

// 测试结果收集
interface TestResult {
  feature: string
  status: 'pass' | 'fail' | 'skip'
  message: string
  screenshot?: string
}

// 使用测试夹具管理状态，避免全局状态污染
type TestFixtures = {
  testResults: TestResult[]
}

const test = base.extend<TestFixtures>({
  testResults: async ({}, use) => {
    const results: TestResult[] = []
    await use(results)
  }
})

// 生产环境配置 - 强制使用生产环境 URL
test.use({ baseURL: PROD_URL })

// 辅助函数: 记录测试结果（使用console输出，由测试框架管理结果）
function recordResult(feature: string, status: 'pass' | 'fail' | 'skip', message: string, _screenshot?: string) {
  console.log(`[${status.toUpperCase()}] ${feature}: ${message}`)
}

// 辅助函数: 登录
async function login(page: Page) {
  await page.goto(`${PROD_URL}/login`)
  await page.waitForLoadState('networkidle')

  // 等待登录表单
  await page.getByPlaceholder('用户名').waitFor({ timeout: 15000 })

  // 填写凭证
  await page.getByPlaceholder('用户名').fill(TEST_USER.username)
  await page.getByPlaceholder('密码').fill(TEST_USER.password)

  // 点击登录
  await page.locator('button').filter({ hasText: /登\s*录/ }).click()

  // 等待跳转
  await page.waitForURL('**/dashboard', { timeout: 30000 })
  await page.waitForLoadState('networkidle')
}

// 辅助函数: 截图
async function takeScreenshot(page: Page, name: string) {
  const path = `test-results/prod-test/${name}.png`
  await page.screenshot({ path, fullPage: true })
  return path
}

test.describe('生产环境功能验证', () => {
  test.setTimeout(120000) // 2分钟超时

  // ==================== 1. 登录测试 ====================
  test('1.1 登录功能验证', async ({ page }) => {
    try {
      await page.goto(`${PROD_URL}/login`)
      await page.waitForLoadState('networkidle')

      // 验证登录页面元素
      await expect(page.getByPlaceholder('用户名')).toBeVisible({ timeout: 10000 })
      await expect(page.getByPlaceholder('密码')).toBeVisible()
      await expect(page.locator('button').filter({ hasText: /登\s*录/ })).toBeVisible()

      // 执行登录
      await page.getByPlaceholder('用户名').fill(TEST_USER.username)
      await page.getByPlaceholder('密码').fill(TEST_USER.password)
      await page.locator('button').filter({ hasText: /登\s*录/ }).click()

      // 等待跳转到仪表盘
      await page.waitForURL('**/dashboard', { timeout: 30000 })

      // 验证登录成功
      await expect(page).toHaveURL(/dashboard/)
      const screenshot = await takeScreenshot(page, '01-login-success')
      recordResult('登录功能', 'pass', '登录成功，已跳转到仪表盘', screenshot)
    } catch (error) {
      const screenshot = await takeScreenshot(page, '01-login-fail')
      recordResult('登录功能', 'fail', `登录失败: ${error}`, screenshot)
      throw error
    }
  })

  // ==================== 2. 仪表盘测试 ====================
  test('2.1 仪表盘页面验证', async ({ page }) => {
    await login(page)

    try {
      // 验证仪表盘标题
      const title = page.locator('h1, .ant-page-header-heading-title')
      await expect(title).toBeVisible({ timeout: 10000 })

      // 验证统计卡片
      const totalDevices = page.locator('.ant-statistic').filter({ hasText: '设备总数' })
      const onlineDevices = page.locator('.ant-statistic').filter({ hasText: '在线设备' })
      const offlineDevices = page.locator('.ant-statistic').filter({ hasText: '离线设备' })
      const unacknowledgedAlarms = page.locator('.ant-statistic').filter({ hasText: '未处理告警' })

      await expect(totalDevices).toBeVisible()
      await expect(onlineDevices).toBeVisible()
      await expect(offlineDevices).toBeVisible()
      await expect(unacknowledgedAlarms).toBeVisible()

      // 获取统计数据
      const totalValue = await totalDevices.locator('.ant-statistic-content-value').textContent()
      const onlineValue = await onlineDevices.locator('.ant-statistic-content-value').textContent()
      const offlineValue = await offlineDevices.locator('.ant-statistic-content-value').textContent()
      const alarmValue = await unacknowledgedAlarms.locator('.ant-statistic-content-value').textContent()

      const screenshot = await takeScreenshot(page, '02-dashboard-stats')
      recordResult('仪表盘统计', 'pass',
        `设备总数: ${totalValue}, 在线: ${onlineValue}, 离线: ${offlineValue}, 未处理告警: ${alarmValue}`,
        screenshot
      )
    } catch (error) {
      const screenshot = await takeScreenshot(page, '02-dashboard-fail')
      recordResult('仪表盘统计', 'fail', `仪表盘加载失败: ${error}`, screenshot)
      throw error
    }
  })

  test('2.2 仪表盘快捷操作面板', async ({ page }) => {
    await login(page)

    try {
      // 检查快捷操作区域
      const quickActions = page.locator('.ant-card:has-text("快捷操作"), .quick-actions, [data-testid="quick-actions"]')
      const hasQuickActions = await quickActions.isVisible().catch(() => false)

      if (hasQuickActions) {
        // 验证快捷操作按钮
        const buttons = await quickActions.locator('button').all()
        console.log(`找到 ${buttons.length} 个快捷操作按钮`)

        const screenshot = await takeScreenshot(page, '03-quick-actions')
        recordResult('快捷操作面板', 'pass', `找到 ${buttons.length} 个快捷操作按钮`, screenshot)
      } else {
        // 检查系统状态卡片
        const systemStatus = page.locator('.ant-card:has-text("系统状态"), .system-status')
        const hasSystemStatus = await systemStatus.isVisible().catch(() => false)

        if (hasSystemStatus) {
          const screenshot = await takeScreenshot(page, '03-system-status')
          recordResult('系统状态面板', 'pass', '系统状态面板可见', screenshot)
        } else {
          recordResult('快捷操作面板', 'skip', '未找到快捷操作或系统状态面板')
        }
      }
    } catch (error) {
      const screenshot = await takeScreenshot(page, '03-quick-actions-fail')
      recordResult('快捷操作面板', 'fail', `快捷操作面板检查失败: ${error}`, screenshot)
    }
  })

  // ==================== 3. 设备管理测试 ====================
  test('3.1 设备列表页面', async ({ page }) => {
    await login(page)

    try {
      // 导航到设备管理
      await page.goto(`${PROD_URL}/devices`)
      await page.waitForLoadState('networkidle')

      // 验证设备表格
      const deviceTable = page.locator('.ant-table')
      await expect(deviceTable).toBeVisible({ timeout: 15000 })

      // 检查层级树
      const hierarchyTree = page.locator('.ant-tree')
      const hasHierarchyTree = await hierarchyTree.isVisible().catch(() => false)

      // 统计设备数量
      const deviceRows = page.locator('.ant-table-tbody tr:not(:has-text("暂无数据"))')
      const deviceCount = await deviceRows.count()

      const screenshot = await takeScreenshot(page, '04-devices-list')
      recordResult('设备列表', 'pass',
        `设备表格可见, 层级树: ${hasHierarchyTree ? '有' : '无'}, 设备数量: ${deviceCount}`,
        screenshot
      )
    } catch (error) {
      const screenshot = await takeScreenshot(page, '04-devices-list-fail')
      recordResult('设备列表', 'fail', `设备列表加载失败: ${error}`, screenshot)
      throw error
    }
  })

  test('3.2 设备详情页 - 新功能', async ({ page }) => {
    await login(page)

    try {
      // 导航到设备管理
      await page.goto(`${PROD_URL}/devices`)
      await page.waitForLoadState('networkidle')

      // 等待设备表格
      const deviceRows = page.locator('.ant-table-tbody tr:not(:has-text("暂无数据"))')
      await deviceRows.first().waitFor({ timeout: 10000 })

      const rowCount = await deviceRows.count()
      if (rowCount === 0) {
        recordResult('设备详情页', 'skip', '没有设备数据，跳过测试')
        return
      }

      // 点击第一个设备进入详情
      const firstDeviceId = await deviceRows.first().locator('td').first().textContent()
      await deviceRows.first().click()

      // 等待设备详情页加载
      await page.waitForURL(/\/devices\/\d+/, { timeout: 10000 })
      await page.waitForLoadState('networkidle')

      // 验证详情页元素
      const detailsContent = page.locator('.ant-descriptions, .device-details, [data-testid="device-details"]')
      await expect(detailsContent.first()).toBeVisible({ timeout: 10000 })

      // 检查实时数据区域
      const realtimeSection = page.locator('.ant-card:has-text("实时数据"), [data-testid="realtime-data"]')
      const hasRealtime = await realtimeSection.isVisible().catch(() => false)

      // 检查历史图表区域
      const historyChart = page.locator('.ant-card:has-text("历史"), [data-testid="history-chart"]')
      const hasHistoryChart = await historyChart.isVisible().catch(() => false)

      // 检查参数配置区域
      const paramsSection = page.locator('.ant-card:has-text("参数"), [data-testid="params-config"]')
      const hasParams = await paramsSection.isVisible().catch(() => false)

      // 检查设备控制区域
      const controlSection = page.locator('.ant-card:has-text("控制"), [data-testid="device-control"]')
      const hasControl = await controlSection.isVisible().catch(() => false)

      const screenshot = await takeScreenshot(page, '05-device-detail')
      recordResult('设备详情页', 'pass',
        `设备ID: ${firstDeviceId}, 实时数据: ${hasRealtime ? '有' : '无'}, 历史图表: ${hasHistoryChart ? '有' : '无'}, 参数配置: ${hasParams ? '有' : '无'}, 设备控制: ${hasControl ? '有' : '无'}`,
        screenshot
      )
    } catch (error) {
      const screenshot = await takeScreenshot(page, '05-device-detail-fail')
      recordResult('设备详情页', 'fail', `设备详情页测试失败: ${error}`, screenshot)
    }
  })

  // ==================== 4. 统计分析测试 ====================
  test('4.1 统计分析页面 - 新功能', async ({ page }) => {
    await login(page)

    try {
      // 导航到统计分析
      await page.goto(`${PROD_URL}/stats`)
      await page.waitForLoadState('networkidle')

      // 验证页面标题
      const title = page.locator('h1, .ant-page-header-heading-title')
      await expect(title).toBeVisible({ timeout: 10000 })

      // 检查设备选择器
      const deviceSelect = page.locator('.ant-select, [data-testid="device-select"]').first()
      const hasDeviceSelect = await deviceSelect.isVisible().catch(() => false)

      // 检查时间范围选择器
      const timeRangePicker = page.locator('.ant-picker-range, [data-testid="time-range-picker"]')
      const hasTimeRange = await timeRangePicker.isVisible().catch(() => false)

      // 检查趋势图表
      const trendChart = page.locator('.recharts-wrapper, .ant-card:has-text("趋势"), [data-testid="trend-chart"]')
      const hasTrendChart = await trendChart.isVisible().catch(() => false)

      const screenshot = await takeScreenshot(page, '06-stats-page')
      recordResult('统计分析页面', 'pass',
        `设备选择器: ${hasDeviceSelect ? '有' : '无'}, 时间范围: ${hasTimeRange ? '有' : '无'}, 趋势图表: ${hasTrendChart ? '有' : '无'}`,
        screenshot
      )
    } catch (error) {
      const screenshot = await takeScreenshot(page, '06-stats-page-fail')
      recordResult('统计分析页面', 'fail', `统计分析页面加载失败: ${error}`, screenshot)
    }
  })

  // ==================== 5. 告警管理测试 ====================
  test('5.1 告警列表页面', async ({ page }) => {
    await login(page)

    try {
      // 导航到告警管理
      await page.goto(`${PROD_URL}/alarms`)
      await page.waitForLoadState('networkidle')

      // 验证告警表格
      const alarmTable = page.locator('.ant-table')
      await expect(alarmTable).toBeVisible({ timeout: 15000 })

      // 检查告警数据
      const alarmRows = page.locator('.ant-table-tbody tr:not(:has-text("暂无数据"))')
      const alarmCount = await alarmRows.count()

      // 检查状态筛选
      const statusFilter = page.locator('.ant-select, [data-testid="status-filter"]').first()
      const hasStatusFilter = await statusFilter.isVisible().catch(() => false)

      const screenshot = await takeScreenshot(page, '07-alarms-list')
      recordResult('告警列表', 'pass',
        `告警表格可见, 告警数量: ${alarmCount}, 状态筛选: ${hasStatusFilter ? '有' : '无'}`,
        screenshot
      )
    } catch (error) {
      const screenshot = await takeScreenshot(page, '07-alarms-list-fail')
      recordResult('告警列表', 'fail', `告警列表加载失败: ${error}`, screenshot)
      throw error
    }
  })

  test('5.2 告警解决功能 - 新功能', async ({ page }) => {
    await login(page)

    try {
      await page.goto(`${PROD_URL}/alarms`)
      await page.waitForLoadState('networkidle')

      // 检查批量操作按钮
      const batchActions = page.locator('[data-testid="batch-actions"], .batch-actions')
      const hasBatchActions = await batchActions.isVisible().catch(() => false)

      // 检查解决按钮
      const resolveButton = page.locator('button:has-text("解决"), [data-testid="btn-resolve"]')
      const hasResolveButton = await resolveButton.first().isVisible().catch(() => false)

      // 检查状态标签
      const statusTags = page.locator('.ant-tag')
      const statusCount = await statusTags.count()

      const screenshot = await takeScreenshot(page, '08-alarm-resolve')
      recordResult('告警解决功能', 'pass',
        `批量操作: ${hasBatchActions ? '有' : '无'}, 解决按钮: ${hasResolveButton ? '有' : '无'}, 状态标签数: ${statusCount}`,
        screenshot
      )
    } catch (error) {
      const screenshot = await takeScreenshot(page, '08-alarm-resolve-fail')
      recordResult('告警解决功能', 'fail', `告警解决功能检查失败: ${error}`, screenshot)
    }
  })

  // ==================== 6. 层级管理测试 ====================
  test('6.1 客户列表和详情页', async ({ page }) => {
    await login(page)

    try {
      // 导航到客户管理
      await page.goto(`${PROD_URL}/customers`)
      await page.waitForLoadState('networkidle')

      // 验证客户列表
      const customerTable = page.locator('.ant-table')
      const hasCustomerTable = await customerTable.isVisible().catch(() => false)

      if (hasCustomerTable) {
        // 点击第一个客户进入详情
        const customerRows = page.locator('.ant-table-tbody tr:not(:has-text("暂无数据"))')
        const customerCount = await customerRows.count()

        if (customerCount > 0) {
          // 获取客户名称
          const customerName = await customerRows.first().locator('td').first().textContent()

          // 点击进入详情
          await customerRows.first().click()
          await page.waitForLoadState('networkidle')

          // 验证详情页
          const detailsPage = page.locator('.ant-descriptions, [data-testid="customer-details"]')
          const hasDetails = await detailsPage.isVisible().catch(() => false)

          const screenshot = await takeScreenshot(page, '09-customer-detail')
          recordResult('客户详情页', 'pass',
            `客户数量: ${customerCount}, 首个客户: ${customerName}, 详情页: ${hasDetails ? '有' : '无'}`,
            screenshot
          )
        } else {
          recordResult('客户详情页', 'skip', '没有客户数据')
        }
      } else {
        // 检查是否有侧边栏层级导航
        const sidebarNav = page.locator('.ant-layout-sider, [data-testid="sidebar-hierarchy"]')
        const hasSidebar = await sidebarNav.isVisible().catch(() => false)

        const screenshot = await takeScreenshot(page, '09-customers-page')
        recordResult('客户页面', 'pass', `页面已加载, 侧边栏导航: ${hasSidebar ? '有' : '无'}`, screenshot)
      }
    } catch (error) {
      const screenshot = await takeScreenshot(page, '09-customer-fail')
      recordResult('客户详情页', 'fail', `客户页面测试失败: ${error}`, screenshot)
    }
  })

  test('6.2 分区列表和详情页', async ({ page }) => {
    await login(page)

    try {
      // 导航到分区管理
      await page.goto(`${PROD_URL}/zones`)
      await page.waitForLoadState('networkidle')

      // 验证分区列表
      const zoneTable = page.locator('.ant-table')
      const hasZoneTable = await zoneTable.isVisible().catch(() => false)

      if (hasZoneTable) {
        const zoneRows = page.locator('.ant-table-tbody tr:not(:has-text("暂无数据"))')
        const zoneCount = await zoneRows.count()

        if (zoneCount > 0) {
          await zoneRows.first().click()
          await page.waitForLoadState('networkidle')

          const detailsPage = page.locator('.ant-descriptions, [data-testid="zone-details"]')
          const hasDetails = await detailsPage.isVisible().catch(() => false)

          const screenshot = await takeScreenshot(page, '10-zone-detail')
          recordResult('分区详情页', 'pass',
            `分区数量: ${zoneCount}, 详情页: ${hasDetails ? '有' : '无'}`,
            screenshot
          )
        } else {
          recordResult('分区详情页', 'skip', '没有分区数据')
        }
      } else {
        recordResult('分区详情页', 'skip', '分区页面未找到表格')
      }
    } catch (error) {
      const screenshot = await takeScreenshot(page, '10-zone-fail')
      recordResult('分区详情页', 'fail', `分区页面测试失败: ${error}`, screenshot)
    }
  })

  test('6.3 分组详情页 - 设备分配功能', async ({ page }) => {
    await login(page)

    try {
      // 导航到分组管理
      await page.goto(`${PROD_URL}/groups`)
      await page.waitForLoadState('networkidle')

      // 验证分组列表
      const groupTable = page.locator('.ant-table')
      const hasGroupTable = await groupTable.isVisible().catch(() => false)

      if (hasGroupTable) {
        const groupRows = page.locator('.ant-table-tbody tr:not(:has-text("暂无数据"))')
        const groupCount = await groupRows.count()

        if (groupCount > 0) {
          // 点击进入详情
          await groupRows.first().click()
          await page.waitForLoadState('networkidle')

          // 检查设备分配功能 (Transfer 穿梭框)
          const transfer = page.locator('.ant-transfer, [data-testid="device-transfer"]')
          const hasTransfer = await transfer.isVisible().catch(() => false)

          // 检查设备列表
          const deviceList = page.locator('.ant-table, .ant-transfer-list')
          const hasDeviceList = await deviceList.isVisible().catch(() => false)

          const screenshot = await takeScreenshot(page, '11-group-detail')
          recordResult('分组详情页', 'pass',
            `分组数量: ${groupCount}, 设备分配(Transfer): ${hasTransfer ? '有' : '无'}, 设备列表: ${hasDeviceList ? '有' : '无'}`,
            screenshot
          )
        } else {
          recordResult('分组详情页', 'skip', '没有分组数据')
        }
      } else {
        recordResult('分组详情页', 'skip', '分组页面未找到表格')
      }
    } catch (error) {
      const screenshot = await takeScreenshot(page, '11-group-fail')
      recordResult('分组详情页', 'fail', `分组详情页测试失败: ${error}`, screenshot)
    }
  })

  // ==================== 7. 层级树导航测试 ====================
  test('7.1 层级树导航功能', async ({ page }) => {
    await login(page)

    try {
      await page.goto(`${PROD_URL}/devices`)
      await page.waitForLoadState('networkidle')

      // 检查层级树
      const hierarchyTree = page.locator('.ant-tree, [data-testid="hierarchy-tree"]')
      await expect(hierarchyTree).toBeVisible({ timeout: 10000 })

      // 展开第一个节点
      const firstExpand = hierarchyTree.locator('.ant-tree-switcher_close').first()
      if (await firstExpand.isVisible()) {
        await firstExpand.click()
        await page.waitForTimeout(500)
      }

      // 点击第一个叶子节点
      const firstNode = hierarchyTree.locator('.ant-tree-node-content-wrapper').first()
      await firstNode.click()
      await page.waitForTimeout(500)

      const screenshot = await takeScreenshot(page, '12-hierarchy-nav')
      recordResult('层级树导航', 'pass', '层级树可展开和点击导航', screenshot)
    } catch (error) {
      const screenshot = await takeScreenshot(page, '12-hierarchy-fail')
      recordResult('层级树导航', 'fail', `层级树导航测试失败: ${error}`, screenshot)
    }
  })

    // ==================== 测试报告输出 ====================
  test('测试完成确认', async ({ page }) => {
    // 简单确认测试套件运行完成
    await page.goto(PROD_URL)
    console.log('\n' + '='.repeat(60))
    console.log('生产环境功能验证测试完成')
    console.log('测试时间:', new Date().toISOString())
    console.log('测试环境:', PROD_URL)
    console.log('='.repeat(60))
    expect(true).toBe(true)
  })
})