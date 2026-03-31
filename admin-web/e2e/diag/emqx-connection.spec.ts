/**
 * EMQX连接状态诊断测试 - 改进版
 * 尝试多种方式获取连接设备信息
 */

import { test, expect } from '@playwright/test'

const EMQX_DASHBOARD_URL = 'http://43.138.195.15:18083'

// EMQX账号
const EMQX_CREDENTIALS = {
  username: process.env.EMQX_USERNAME || 'admin',
  password: process.env.EMQX_PASSWORD || 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=',
}

test.describe('EMQX连接诊断', () => {
  test('获取EMQX连接设备信息', async ({ page }) => {
    console.log('\n' + '='.repeat(80))
    console.log('EMQX连接设备诊断')
    console.log('='.repeat(80))

    // 访问EMQX Dashboard
    await page.goto(EMQX_DASHBOARD_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    console.log(`初始URL: ${page.url()}`)
    await page.screenshot({ path: 'test-results/diag/emqx-v2-01-initial.png', fullPage: true })

    // 检查是否需要登录
    const needsLogin = await page.locator('input[type="password"]').isVisible().catch(() => false)

    if (needsLogin) {
      console.log('需要登录EMQX Dashboard...')

      // EMQX 5.x 登录表单
      const usernameInput = page.locator('input[type="text"], textbox[name="Username"]').first()
      const passwordInput = page.locator('input[type="password"], textbox[name="Password"]').first()
      const loginButton = page.locator('button:has-text("Login")').first()

      await usernameInput.fill(EMQX_CREDENTIALS.username)
      await passwordInput.fill(EMQX_CREDENTIALS.password)

      // 等待按钮可点击
      await loginButton.waitFor({ state: 'visible', timeout: 5000 })
      await loginButton.click()

      // 等待登录完成
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)
    }

    console.log(`登录后URL: ${page.url()}`)
    await page.screenshot({ path: 'test-results/diag/emqx-v2-02-loggedin.png', fullPage: true })

    // 尝试访问Dashboard Overview
    console.log('\n尝试访问Dashboard Overview...')
    await page.goto(`${EMQX_DASHBOARD_URL}/#/dashboard/overview`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/diag/emqx-v2-03-overview.png', fullPage: true })

    // 提取Dashboard概览统计
    const overviewStats = await page.evaluate(() => {
      const stats: { [key: string]: string } = {}
      // 查找所有统计数字
      const elements = document.querySelectorAll('[class*="statistic"], [class*="metric"], .ant-statistic, .stat-card')
      elements.forEach(el => {
        const title = el.querySelector('[class*="title"], .ant-statistic-title')?.textContent?.trim()
        const value = el.querySelector('[class*="value"], .ant-statistic-content-value')?.textContent?.trim()
        if (title && value) {
          stats[title] = value
        }
      })
      return stats
    })
    console.log('Dashboard Overview统计:', JSON.stringify(overviewStats, null, 2))

    // 尝试访问Clients页面（EMQX 5.x路由）
    console.log('\n尝试访问Clients页面...')
    const clientRoutes = [
      `${EMQX_DASHBOARD_URL}/#/clients`,
      `${EMQX_DASHBOARD_URL}/#/connections`,
      `${EMQX_DASHBOARD_URL}/#/monitor/clients`,
    ]

    for (const route of clientRoutes) {
      console.log(`尝试路由: ${route}`)
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      const currentUrl = page.url()
      console.log(`当前URL: ${currentUrl}`)

      // 检查是否成功加载客户端列表
      const hasClientTable = await page.locator('table').isVisible().catch(() => false)
      const has404 = await page.locator(':text("Not Found"), :text("404")').isVisible().catch(() => false)

      if (hasClientTable && !has404) {
        console.log('成功加载客户端列表!')
        await page.screenshot({ path: 'test-results/diag/emqx-v2-04-clients.png', fullPage: true })

        // 提取客户端信息
        const clientInfo = await page.evaluate(() => {
          const info: { total: number; clients: string[] } = { total: 0, clients: [] }

          // 获取表格行数
          const rows = document.querySelectorAll('table tbody tr')
          info.total = rows.length

          // 获取分页信息
          const pagination = document.querySelector('.ant-pagination, [class*="pagination"]')
          if (pagination) {
            const totalText = pagination.textContent?.match(/共\s*(\d+)/)?.[1]
            if (totalText) {
              info.total = parseInt(totalText, 10)
            }
          }

          // 提取客户端ID列表
          rows.forEach(row => {
            const cells = row.querySelectorAll('td')
            if (cells.length > 0) {
              info.clients.push(cells[0]?.textContent?.trim() || '')
            }
          })

          return info
        })
        console.log('客户端信息:', JSON.stringify(clientInfo, null, 2))

        // 尝试获取更多页的数据
        const nextButton = page.locator('.ant-pagination-next:not(.ant-pagination-disabled)').first()
        if (await nextButton.isVisible().catch(() => false)) {
          console.log('尝试获取更多客户端数据...')
          for (let i = 0; i < 3; i++) {
            await nextButton.click()
            await page.waitForLoadState('networkidle')
            await page.waitForTimeout(1000)
          }
          await page.screenshot({ path: 'test-results/diag/emqx-v2-05-clients-more.png', fullPage: true })
        }

        break
      }

      if (has404) {
        console.log('路由返回404，尝试下一个...')
      }
    }

    // 尝试通过Monitoring获取连接数
    console.log('\n尝试通过Monitoring获取连接数...')
    await page.goto(`${EMQX_DASHBOARD_URL}/#/monitor`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test-results/diag/emqx-v2-06-monitor.png', fullPage: true })

    // 提取Monitoring数据
    const monitorStats = await page.evaluate(() => {
      const stats: { [key: string]: string } = {}
      // 查找所有带数字的元素
      const numberElements = document.querySelectorAll('[class*="count"], [class*="metric"], .metric-value')
      numberElements.forEach(el => {
        const label = el.closest('.metric-card, [class*="metric"]')?.querySelector('[class*="label"]')?.textContent?.trim()
        const value = el.textContent?.trim()
        if (label && value) {
          stats[label] = value
        }
      })
      return stats
    })
    console.log('Monitoring统计:', JSON.stringify(monitorStats, null, 2))

    // 生成诊断报告
    const report = {
      timestamp: new Date().toISOString(),
      dashboardUrl: EMQX_DASHBOARD_URL,
      overviewStats,
      monitorStats,
      findings: {
        has404Pages: await page.locator(':text("Not Found")').isVisible().catch(() => false),
        currentUrl: page.url(),
      },
    }

    test.info().attachments.push({
      name: 'emqx-connection-report.json',
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(report, null, 2)),
    })

    console.log('\n' + '='.repeat(80))
    console.log('诊断完成')
    console.log('='.repeat(80))
  })
})