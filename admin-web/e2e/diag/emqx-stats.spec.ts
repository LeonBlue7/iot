/**
 * EMQX精确统计信息提取
 * 针对EMQX 5.x Dashboard结构优化
 */

import { test, expect } from '@playwright/test'

const EMQX_DASHBOARD_URL = 'http://43.138.195.15:18083'

const EMQX_CREDENTIALS = {
  username: 'admin',
  password: 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=',
}

test.describe('EMQX精确诊断', () => {
  test('提取EMQX Dashboard连接统计', async ({ page }) => {
    console.log('\n' + '='.repeat(80))
    console.log('EMQX Dashboard连接统计提取')
    console.log('='.repeat(80))

    // 登录
    await page.goto(EMQX_DASHBOARD_URL)
    await page.waitForLoadState('networkidle')

    const needsLogin = await page.locator('input[type="password"]').isVisible().catch(() => false)
    if (needsLogin) {
      await page.locator('input[type="text"]').fill(EMQX_CREDENTIALS.username)
      await page.locator('input[type="password"]').fill(EMQX_CREDENTIALS.password)
      await page.locator('button:has-text("Login")').click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
    }

    // 访问Dashboard Overview
    await page.goto(`${EMQX_DASHBOARD_URL}/#/dashboard/overview`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'test-results/diag/emqx-stats-01-overview.png', fullPage: true })

    // 提取页面全部文本内容进行分析
    const pageText = await page.evaluate(() => document.body.innerText)
    console.log('\nDashboard Overview页面文本内容:')
    console.log(pageText.substring(0, 2000))

    // 提取所有数字和标签
    const numbersWithLabels = await page.evaluate(() => {
      const results: { label: string; value: string }[] = []

      // 查找所有可能的统计卡片
      const cards = document.querySelectorAll('[class*="card"], [class*="stat"], [class*="metric"], .ant-card')
      cards.forEach(card => {
        const text = card.textContent?.trim()
        if (text) {
          // 提取包含数字的文本
          const match = text.match(/^(.+?)\s+(\d+)$/)
          if (match) {
            results.push({ label: match[1].trim(), value: match[2] })
          }
        }
      })

      // 查找所有带数字的元素
      const allElements = document.querySelectorAll('*')
      allElements.forEach(el => {
        const text = el.textContent?.trim()
        if (text && /^\d+$/.test(text) && text.length <= 10) {
          // 尝找相邻的标签
          const parent = el.parentElement
          if (parent) {
            const labelEl = parent.querySelector('[class*="label"], [class*="title"], h1, h2, h3, h4, h5, h6')
            if (labelEl && labelEl !== el) {
              const label = labelEl.textContent?.trim()
              if (label && !results.find(r => r.label === label)) {
                results.push({ label, value: text })
              }
            }
          }
        }
      })

      return results
    })
    console.log('\n提取的统计数据:', JSON.stringify(numbersWithLabels, null, 2))

    // 访问Connections页面
    console.log('\n访问Connections页面...')
    await page.goto(`${EMQX_DASHBOARD_URL}/#/connections`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'test-results/diag/emqx-stats-02-connections.png', fullPage: true })

    // 检查Connections页面内容
    const connectionsText = await page.evaluate(() => document.body.innerText)
    console.log('\nConnections页面文本内容:')
    console.log(connectionsText.substring(0, 2000))

    // 检查是否有表格
    const hasTable = await page.locator('table').isVisible().catch(() => false)
    if (hasTable) {
      // 获取表格内容
      const tableData = await page.evaluate(() => {
        const rows: string[][] = []
        document.querySelectorAll('table tbody tr').forEach(tr => {
          const cells: string[] = []
          tr.querySelectorAll('td').forEach(td => {
            cells.push(td.textContent?.trim() || '')
          })
          if (cells.length > 0) {
            rows.push(cells)
          }
        })
        return rows
      })
      console.log('\n表格数据 (前10行):')
      tableData.slice(0, 10).forEach(row => {
        console.log(`  ${row.join(' | ')}`)
      })
      console.log(`\n总行数: ${tableData.length}`)

      // 获取分页信息
      const paginationInfo = await page.locator('.ant-pagination').textContent().catch(() => '')
      console.log(`分页信息: ${paginationInfo}`)
    }

    // 生成报告
    const report = {
      timestamp: new Date().toISOString(),
      overviewStats: numbersWithLabels,
      connectionsPage: {
        hasTable,
        textPreview: connectionsText.substring(0, 500),
      },
    }

    test.info().attachments.push({
      name: 'emqx-stats-report.json',
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(report, null, 2)),
    })

    console.log('\n' + '='.repeat(80))
    console.log('诊断完成')
    console.log('='.repeat(80))
  })
})