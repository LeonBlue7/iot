/**
 * 设备数量诊断测试
 *
 * 诊断目标：
 * 1. 检查管理后台仪表盘显示的设备数量
 * 2. 检查API返回的实际数据
 * 3. 检查EMQX Dashboard的设备连接状态
 * 4. 分析设备数量不一致的原因
 */

import { test, expect, request } from '@playwright/test'

const BASE_URL = 'https://www.jxbonner.cloud'
const EMQX_DASHBOARD_URL = 'http://43.138.195.15:18083'

// 测试账号
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'OGhinH+f/Ey1Ysf+MRQ1qA==',
}

// EMQX账号 (从.env读取)
const EMQX_CREDENTIALS = {
  username: process.env.EMQX_USERNAME || 'admin',
  password: process.env.EMQX_PASSWORD || 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=',
}

interface ApiLog {
  url: string
  method: string
  status: number
  responseBody: unknown
  timestamp: string
}

test.describe('设备数量诊断', () => {
  test('完整诊断：管理后台 vs EMQX 设备数量', async ({ page, context }) => {
    const apiLogs: ApiLog[] = []

    // 监听所有API响应
    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/api/')) {
        let responseBody: unknown = null
        try {
          responseBody = await response.json()
        } catch {
          // 忽略非JSON响应
        }
        apiLogs.push({
          url,
          method: response.request().method(),
          status: response.status(),
          responseBody,
          timestamp: new Date().toISOString(),
        })
        console.log(`[API] ${response.status()} ${response.request().method()} ${url}`)
        if (responseBody && typeof responseBody === 'object') {
          const bodyStr = JSON.stringify(responseBody)
          console.log(`      Body: ${bodyStr.substring(0, 500)}${bodyStr.length > 500 ? '...' : ''}`)
        }
      }
    })

    // ===== 步骤1: 登录管理后台 =====
    console.log('\n' + '='.repeat(80))
    console.log('步骤1: 登录管理后台')
    console.log('='.repeat(80))

    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/diag/device-01-login-page.png', fullPage: true })

    // 填写登录表单
    const usernameInput = page.locator('input[type="text"], input#username, input[name="username"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first()

    await usernameInput.fill(TEST_CREDENTIALS.username)
    await passwordInput.fill(TEST_CREDENTIALS.password)
    await loginButton.click()

    // 等待登录完成
    try {
      await page.waitForURL('**/dashboard**', { timeout: 15000 })
    } catch {
      console.log('警告: 等待跳转到dashboard超时')
    }
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const currentUrl = page.url()
    console.log(`当前URL: ${currentUrl}`)
    await page.screenshot({ path: 'test-results/diag/device-02-dashboard.png', fullPage: true })

    // ===== 步骤2: 分析仪表盘数据 =====
    console.log('\n' + '='.repeat(80))
    console.log('步骤2: 分析仪表盘数据')
    console.log('='.repeat(80))

    // 等待仪表盘数据加载
    await page.waitForTimeout(3000)

    // 提取仪表盘上的数字
    const dashboardStats = await page.evaluate(() => {
      const stats: { label: string; value: string }[] = []

      // 尝试多种选择器获取统计卡片
      const statCards = document.querySelectorAll('.ant-card, .stat-card, [class*="statistic"], [class*="dashboard"]')
      statCards.forEach(card => {
        const text = card.textContent || ''
        // 提取数字
        const numbers = text.match(/\d+/g)
        if (numbers) {
          stats.push({
            label: text.replace(/\d+/g, '').trim().substring(0, 50),
            value: numbers.join(', ')
          })
        }
      })

      // 尝试获取 Ant Design Statistic 组件
      const antStatistics = document.querySelectorAll('.ant-statistic')
      antStatistics.forEach(stat => {
        const title = stat.querySelector('.ant-statistic-title')?.textContent || ''
        const value = stat.querySelector('.ant-statistic-content-value')?.textContent || ''
        if (title && value) {
          stats.push({ label: title, value })
        }
      })

      return stats
    })

    console.log('仪表盘统计信息:')
    dashboardStats.forEach(stat => {
      console.log(`  ${stat.label}: ${stat.value}`)
    })

    // ===== 步骤3: 分析API返回的设备数据 =====
    console.log('\n' + '='.repeat(80))
    console.log('步骤3: 分析API返回的设备数据')
    console.log('='.repeat(80))

    // 查找设备相关API
    const deviceApis = apiLogs.filter(log =>
      log.url.includes('/api/devices') || log.url.includes('/api/stats')
    )

    console.log(`\n找到 ${deviceApis.length} 个设备/统计相关API请求:\n`)
    deviceApis.forEach(log => {
      console.log(`--- ${log.method} ${log.url} ---`)
      console.log(`状态: ${log.status}`)
      if (log.responseBody) {
        const body = log.responseBody as Record<string, unknown>
        if (Array.isArray(body)) {
          console.log(`返回数组长度: ${body.length}`)
          if (body.length > 0) {
            console.log(`第一条数据: ${JSON.stringify(body[0]).substring(0, 200)}`)
          }
        } else if (typeof body === 'object') {
          if ('data' in body && Array.isArray(body.data)) {
            console.log(`data数组长度: ${body.data.length}`)
          }
          if ('total' in body) {
            console.log(`total: ${body.total}`)
          }
          if ('devices' in body && Array.isArray(body.devices)) {
            console.log(`devices数组长度: ${body.devices.length}`)
          }
          console.log(`完整响应: ${JSON.stringify(body).substring(0, 500)}`)
        }
      }
    })

    // ===== 步骤4: 直接调用API获取设备数据 =====
    console.log('\n' + '='.repeat(80))
    console.log('步骤4: 直接调用API获取设备数据')
    console.log('='.repeat(80))

    // 从localStorage获取token
    const authStorage = await page.evaluate(() => {
      return localStorage.getItem('auth-storage')
    })

    let token: string | null = null
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      token = parsed?.state?.token
      console.log(`Token存在: ${token ? '是' : '否'}`)
    }

    if (token) {
      // 使用API Context直接调用API
      const apiContext = await request.newContext({
        baseURL: BASE_URL,
        extraHTTPHeaders: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      // 获取设备列表
      console.log('\n调用 GET /api/devices:')
      const devicesResponse = await apiContext.get('/api/devices')
      console.log(`  状态: ${devicesResponse.status()}`)
      const devicesData = await devicesResponse.json()
      console.log(`  响应: ${JSON.stringify(devicesData).substring(0, 1000)}`)

      // 获取统计概览
      console.log('\n调用 GET /api/stats/overview:')
      const statsResponse = await apiContext.get('/api/stats/overview')
      console.log(`  状态: ${statsResponse.status()}`)
      const statsData = await statsResponse.json()
      console.log(`  响应: ${JSON.stringify(statsData)}`)

      // 保存API数据
      test.info().attachments.push({
        name: 'api-devices-response.json',
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify(devicesData, null, 2)),
      })
      test.info().attachments.push({
        name: 'api-stats-response.json',
        contentType: 'application/json',
        body: Buffer.from(JSON.stringify(statsData, null, 2)),
      })

      await apiContext.dispose()
    }

    // ===== 步骤5: 访问设备管理页面 =====
    console.log('\n' + '='.repeat(80))
    console.log('步骤5: 访问设备管理页面')
    console.log('='.repeat(80))

    // 点击设备菜单
    const deviceMenu = page.locator('a:has-text("设备"), a:has-text("Device"), [data-menu-id="devices"]').first()
    const isDeviceMenuVisible = await deviceMenu.isVisible().catch(() => false)

    if (isDeviceMenuVisible) {
      await deviceMenu.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/diag/device-03-devices-page.png', fullPage: true })

      // 检查设备列表
      const deviceRows = await page.locator('table tbody tr, .ant-list-item').count()
      console.log(`设备列表行数: ${deviceRows}`)

      // 检查表格内容
      const tableContent = await page.locator('table').textContent().catch(() => '')
      console.log(`表格内容摘要: ${tableContent?.substring(0, 300)}`)
    }

    await page.screenshot({ path: 'test-results/diag/device-04-final.png', fullPage: true })

    // ===== 生成诊断报告 =====
    console.log('\n' + '='.repeat(80))
    console.log('诊断报告')
    console.log('='.repeat(80))

    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      loginStatus: currentUrl.includes('/login') ? '失败' : '成功',
      dashboardStats,
      apiLogs: apiLogs.map(log => ({
        url: log.url,
        method: log.method,
        status: log.status,
        responseBody: log.responseBody
      })),
    }

    test.info().attachments.push({
      name: 'device-diagnostic-report.json',
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(report, null, 2)),
    })

    console.log('\n诊断完成!')
  })

  test('EMQX Dashboard诊断', async ({ page }) => {
    console.log('\n' + '='.repeat(80))
    console.log('EMQX Dashboard诊断')
    console.log('='.repeat(80))

    // 访问EMQX Dashboard
    console.log(`\n访问 EMQX Dashboard: ${EMQX_DASHBOARD_URL}`)
    await page.goto(EMQX_DASHBOARD_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 检查是否在登录页面
    const currentUrl = page.url()
    console.log(`当前URL: ${currentUrl}`)

    await page.screenshot({ path: 'test-results/diag/emqx-01-landing.png', fullPage: true })

    // 检查是否有登录表单
    const loginForm = page.locator('input[type="text"], input[name="username"], input#username').first()
    const isLoginPage = await loginForm.isVisible().catch(() => false)

    if (isLoginPage) {
      console.log('检测到登录页面，尝试登录...')

      // 填写登录表单
      await loginForm.fill(EMQX_CREDENTIALS.username)
      const passwordInput = page.locator('input[type="password"]').first()
      await passwordInput.fill(EMQX_CREDENTIALS.password)

      const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login"), button:has-text("Sign")').first()
      await loginButton.click()

      try {
        await page.waitForURL('**/dashboard**', { timeout: 15000 })
      } catch {
        console.log('警告: 登录后URL未跳转到dashboard')
      }

      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)
    }

    await page.screenshot({ path: 'test-results/diag/emqx-02-after-login.png', fullPage: true })

    // 尝试查找客户端/设备连接信息
    console.log('\n查找设备连接信息...')

    // EMQX 5.x Dashboard结构
    const clientSelectors = [
      'a:has-text("Client")',
      'a:has-text("客户端")',
      'a:has-text("Connections")',
      'a:has-text("连接")',
      '[data-menu-id="clients"]',
      '[data-menu-id="connections"]',
    ]

    for (const selector of clientSelectors) {
      const element = page.locator(selector).first()
      const isVisible = await element.isVisible().catch(() => false)
      if (isVisible) {
        console.log(`找到菜单: ${selector}`)
        await element.click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)
        await page.screenshot({ path: 'test-results/diag/emqx-03-clients.png', fullPage: true })
        break
      }
    }

    // 提取连接数信息
    const connectionInfo = await page.evaluate(() => {
      const info: string[] = []

      // 查找显示数字的元素
      const numberElements = document.querySelectorAll('[class*="count"], [class*="number"], .ant-statistic-content-value, .value')
      numberElements.forEach(el => {
        const text = el.textContent?.trim()
        if (text && /^\d+$/.test(text)) {
          const label = el.closest('.ant-statistic')?.querySelector('.ant-statistic-title')?.textContent || 'Unknown'
          info.push(`${label}: ${text}`)
        }
      })

      // 查找包含"client"或"连接"的文本
      const allText = document.body.innerText
      const clientLines = allText.split('\n').filter(line =>
        line.toLowerCase().includes('client') ||
        line.includes('客户端') ||
        line.includes('连接') ||
        line.includes('连接数')
      )
      info.push(...clientLines.slice(0, 10))

      return info
    })

    console.log('\n连接信息:')
    connectionInfo.forEach(info => console.log(`  ${info}`))

    // 尝试访问客户端页面
    try {
      await page.goto(`${EMQX_DASHBOARD_URL}/#/clients`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'test-results/diag/emqx-04-clients-page.png', fullPage: true })

      // 获取客户端列表
      const clientRows = await page.locator('table tbody tr').count()
      console.log(`\n客户端列表行数: ${clientRows}`)

      // 获取分页信息
      const pagination = await page.locator('.ant-pagination, [class*="pagination"]').textContent().catch(() => '')
      console.log(`分页信息: ${pagination}`)
    } catch {
      console.log('无法访问客户端页面')
    }

    // 获取Dashboard首页统计
    try {
      await page.goto(`${EMQX_DASHBOARD_URL}/#/dashboard`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'test-results/diag/emqx-05-dashboard.png', fullPage: true })
    } catch {
      console.log('无法访问Dashboard首页')
    }

    console.log('\nEMQX诊断完成!')
  })
})