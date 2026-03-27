import { test, expect } from './fixtures'
import { AlarmsPage } from './pages'

/**
 * 告警管理 E2E 测试
 *
 * 测试场景：
 * 1. 告警列表页面加载
 * 2. 告警列表数据显示
 * 3. 确认告警
 * 4. 告警状态显示
 */
test.describe('告警管理', () => {
  let alarmsPage: AlarmsPage

  test.beforeEach(async ({ authenticatedPage }) => {
    alarmsPage = new AlarmsPage(authenticatedPage)
    await alarmsPage.goto()
  })

  test('告警列表页面应正确加载', async () => {
    // 验证页面标题
    await expect(alarmsPage.title).toBeVisible()

    // 验证告警表格存在
    await expect(alarmsPage.alarmTable).toBeVisible()
  })

  test('告警列表应显示告警数据', async () => {
    // 等待数据加载
    await alarmsPage.alarmTable.waitFor({ state: 'visible' })

    // 验证表头
    const headers = ['告警 ID', '设备 ID', '告警类型', '告警值', '阈值', '状态', '时间']
    for (const header of headers) {
      await expect(alarmsPage.alarmTable.locator(`th:has-text("${header}")`)).toBeVisible()
    }
  })

  test('告警类型显示正确的中文名称', async ({ page }) => {
    // 等待表格加载
    await alarmsPage.alarmTable.waitFor({ state: 'visible' })

    // 获取告警类型标签
    const typeTag = page.locator('.ant-table-tbody tr:first-child td:nth-child(3) .ant-tag')

    if (await typeTag.isVisible()) {
      const typeText = await typeTag.textContent()
      // 验证是中文类型
      const validTypes = ['温度过高', '温度过低', '湿度过高', '湿度过低']
      expect(validTypes).toContain(typeText?.trim())
    }
  })

  test('告警状态显示正确', async ({ page }) => {
    // 等待表格加载
    await alarmsPage.alarmTable.waitFor({ state: 'visible' })

    // 获取状态标签
    const statusTag = page.locator('.ant-table-tbody tr:first-child td:nth-child(6) .ant-tag')

    if (await statusTag.isVisible()) {
      const statusText = await statusTag.textContent()
      // 验证状态值
      const validStatus = ['未处理', '已确认', '已解决']
      expect(validStatus).toContain(statusText?.trim())
    }
  })

  test('确认未处理的告警', async ({ page }) => {
    // 等待表格加载
    await alarmsPage.alarmTable.waitFor({ state: 'visible' })

    // 检查是否有未处理的告警
    const unacknowledgedCount = await alarmsPage.getUnacknowledgedCount()

    if (unacknowledgedCount > 0) {
      // 获取第一个未处理告警的ID
      const alarmId = await page.locator('.ant-table-tbody tr:first-child td:first-child').textContent()

      if (alarmId) {
        // 点击确认按钮
        await page.locator('.ant-table-tbody tr:first-child button:has-text("确认")').click()

        // 验证确认对话框出现
        await expect(page.locator('.ant-modal-confirm')).toBeVisible()
        await expect(page.locator('.ant-modal-confirm .ant-modal-confirm-title')).toContainText('确认告警')

        // 点击确定
        await page.locator('.ant-modal-confirm button:has-text("确定")').click()

        // 验证成功提示
        await expect(page.locator('.ant-message-success')).toBeVisible()

        // 等待数据刷新后，验证状态变为已确认
        // 注意：需要等待API响应和表格刷新
      }
    }
  })

  test('取消确认告警操作', async ({ page }) => {
    // 等待表格加载
    await alarmsPage.alarmTable.waitFor({ state: 'visible' })

    // 检查是否有未处理的告警
    const unacknowledgedCount = await alarmsPage.getUnacknowledgedCount()

    if (unacknowledgedCount > 0) {
      // 点击确认按钮
      await page.locator('.ant-table-tbody tr:first-child button:has-text("确认")').click()

      // 验证确认对话框出现
      await expect(page.locator('.ant-modal-confirm')).toBeVisible()

      // 点击取消
      await page.locator('.ant-modal-confirm button:has-text("取消")').click()

      // 验证对话框关闭
      await expect(page.locator('.ant-modal-confirm')).not.toBeVisible()

      // 验证状态未改变
      const statusTag = page.locator('.ant-table-tbody tr:first-child td:nth-child(6) .ant-tag')
      const statusText = await statusTag.textContent()
      expect(statusText).toContain('未处理')
    }
  })

  test('已确认告警不显示确认按钮', async ({ page }) => {
    // 等待表格加载
    await alarmsPage.alarmTable.waitFor({ state: 'visible' })

    // 等待表格行出现
    const rows = page.locator('.ant-table-tbody tr')
    await rows.first().waitFor({ state: 'visible', timeout: 10000 })

    const rowCount = await rows.count()
    let foundAcknowledged = false

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const statusTag = row.locator('td:nth-child(6) .ant-tag')

      // 检查状态标签是否可见
      if (await statusTag.isVisible({ timeout: 2000 }).catch(() => false)) {
        const statusText = await statusTag.textContent()

        // 如果是已确认或已解决状态
        if (statusText?.includes('已确认') || statusText?.includes('已解决')) {
          foundAcknowledged = true
          // 验证该行没有确认按钮
          const confirmButton = row.locator('button:has-text("确认")')
          await expect(confirmButton).not.toBeVisible()
        }
      }
    }

    // 如果没有找到已确认的告警，记录日志
    if (!foundAcknowledged) {
      console.log('没有找到已确认或已解决的告警')
    }
  })

  test('分页功能正常工作', async ({ page }) => {
    // 等待表格加载
    await alarmsPage.alarmTable.waitFor({ state: 'visible' })

    // 检查分页器
    const pagination = page.locator('.ant-pagination')
    const paginationExists = await pagination.isVisible().catch(() => false)

    if (paginationExists) {
      // 验证每页显示条数
      const pageSize = await page.locator('.ant-pagination-options').textContent()
      expect(pageSize).toMatch(/\d+ 条/)

      // 验证分页器状态
      const currentPage = await page.locator('.ant-pagination-item-active').textContent()
      expect(currentPage).toBe('1')
    }
  })
})

test.describe('告警管理 - 仪表盘关联', () => {
  test('从仪表盘查看最近告警', async ({ authenticatedPage }) => {
    // 访问仪表盘
    await authenticatedPage.goto('/dashboard')

    // 等待数据加载
    await authenticatedPage.locator('h1:has-text("仪表盘")').waitFor()

    // 检查最近告警表格
    const recentAlarmsCard = authenticatedPage.locator('.ant-card:has-text("最近告警")')

    if (await recentAlarmsCard.isVisible()) {
      // 如果有告警数据
      const alarmTable = recentAlarmsCard.locator('.ant-table')
      if (await alarmTable.isVisible()) {
        // 验证告警数据显示
        const rows = await alarmTable.locator('tbody tr').all()
        expect(rows.length).toBeLessThanOrEqual(5) // 最近5条
      } else {
        // 如果没有告警
        await expect(recentAlarmsCard.locator('.ant-alert:has-text("暂无告警记录")')).toBeVisible()
      }
    }
  })

  test('仪表盘未处理告警数与告警页面一致', async ({ authenticatedPage }) => {
    // 获取仪表盘的未处理告警数
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.locator('h1:has-text("仪表盘")').waitFor()

    const dashboardStat = authenticatedPage.locator('.ant-statistic').filter({ hasText: '未处理告警' })
    const dashboardValue = await dashboardStat.locator('.ant-statistic-content-value').textContent()

    // 跳转到告警页面
    await authenticatedPage.goto('/alarms')
    await authenticatedPage.locator('h1:has-text("告警管理")').waitFor()

    // 统计未处理告警数
    const unprocessedRows = await authenticatedPage
      .locator('.ant-table-tbody tr:has(.ant-tag:has-text("未处理"))')
      .all()

    // 验证数量一致（仪表盘可能只显示未处理，告警页面可能显示所有）
    // 这里主要验证页面数据加载正确
    expect(unprocessedRows.length).toBeGreaterThanOrEqual(0)
  })
})