/**
 * EMQX深度诊断 - 解决登录问题并获取完整统计
 */

import { test, expect } from '@playwright/test'

const EMQX_DASHBOARD_URL = 'http://43.138.195.15:18083'

const EMQX_CREDENTIALS = {
  username: 'admin',
  password: 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=',
}

test.describe('EMQX深度诊断', () => {
  test('完整EMQX统计信息获取', async ({ page, context }) => {
    console.log('\n' + '='.repeat(80))
    console.log('EMQX深度诊断')
    console.log('='.repeat(80))

    // 步骤1: 访问并登录
    console.log('\n步骤1: 访问EMQX Dashboard并登录')
    await page.goto(EMQX_DASHBOARD_URL)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // 检查当前页面状态
    const currentUrl = page.url()
    console.log(`当前URL: ${currentUrl}`)

    // 截图登录前状态
    await page.screenshot({ path: 'test-results/diag/emqx-deep-01-before-login.png', fullPage: true })

    // 检查是否在登录页面
    const isInLoginPage = currentUrl.includes('/login') || await page.locator('input[type="password"]').isVisible()
    console.log(`是否在登录页面: ${isInLoginPage}`)

    if (isInLoginPage) {
      console.log('执行登录...')
      // 等待表单加载
      await page.waitForSelector('input[type="text"]', { timeout: 10000 })
      await page.waitForSelector('input[type="password"]', { timeout: 10000 })

      // 清空并填写表单
      const usernameInput = page.locator('input[type="text"]').first()
      const passwordInput = page.locator('input[type="password"]').first()

      await usernameInput.clear()
      await usernameInput.fill(EMQX_CREDENTIALS.username)
      console.log(`已填写用户名: ${EMQX_CREDENTIALS.username}`)

      await passwordInput.clear()
      await passwordInput.fill(EMQX_CREDENTIALS.password)
      console.log(`已填写密码`)

      // 截图填写后状态
      await page.screenshot({ path: 'test-results/diag/emqx-deep-02-filled.png', fullPage: true })

      // 点击登录按钮
      const loginButton = page.locator('button:has-text("Login")').first()
      await loginButton.click()
      console.log('已点击登录按钮')

      // 等待登录完成 - 等待URL变化或页面跳转
      try {
        await page.waitForURL(/#\/dashboard/, { timeout: 15000 })
        console.log('URL已变化到dashboard')
      } catch {
        console.log('URL未变化，检查页面状态')
      }

      // 等待页面稳定
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(3000)

      // 截图登录后状态
      await page.screenshot({ path: 'test-results/diag/emqx-deep-03-after-login.png', fullPage: true })

      const newUrl = page.url()
      console.log(`登录后URL: ${newUrl}`)

      // 检查是否仍然在登录页面
      const stillInLogin = await page.locator('input[type="password"]').isVisible().catch(() => false)
      if (stillInLogin) {
        console.log('警告: 仍在登录页面，可能登录失败')

        // 检查是否有错误消息
        const errorMsg = await page.locator('.ant-message-error, [class*="error"], :text("failed")').textContent().catch(() => '')
        console.log(`错误消息: ${errorMsg}`)
      }
    }

    // 步骤2: 获取Dashboard Overview页面统计
    console.log('\n步骤2: 获取Dashboard Overview统计')
    await page.goto(`${EMQX_DASHBOARD_URL}/#/dashboard/overview`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const overviewUrl = page.url()
    console.log(`Overview URL: ${overviewUrl}`)
    await page.screenshot({ path: 'test-results/diag/emqx-deep-04-overview.png', fullPage: true })

    // 检查页面是否加载成功
    const overviewContent = await page.content()
    const overviewText = await page.evaluate(() => document.body.innerText)
    console.log('\nOverview页面内容摘要:')
    console.log(overviewText.substring(0, 1500))

    // 检查是否有"Login has expired"提示
    if (overviewText.includes('Login has expired')) {
      console.log('警告: 登录已过期，重新登录...')
      // 重新执行登录流程
      await page.goto(EMQX_DASHBOARD_URL)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(1000)

      await page.locator('input[type="text"]').fill(EMQX_CREDENTIALS.username)
      await page.locator('input[type="password"]').fill(EMQX_CREDENTIALS.password)
      await page.locator('button:has-text("Login")').click()

      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(5000)

      // 再次尝试访问Overview
      await page.goto(`${EMQX_DASHBOARD_URL}/#/dashboard/overview`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)

      const retryText = await page.evaluate(() => document.body.innerText)
      console.log('\n重新登录后Overview内容:')
      console.log(retryText.substring(0, 1500))
      await page.screenshot({ path: 'test-results/diag/emqx-deep-05-retry-overview.png', fullPage: true })
    }

    // 步骤3: 尝试访问WebSocket页面获取实时连接数据
    console.log('\n步骤3: 访问WebSocket页面')
    try {
      await page.goto(`${EMQX_DASHBOARD_URL}/#/websocket`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/diag/emqx-deep-06-websocket.png', fullPage: true })

      const wsText = await page.evaluate(() => document.body.innerText)
      console.log('\nWebSocket页面内容:')
      console.log(wsText.substring(0, 800))
    } catch {
      console.log('WebSocket页面访问失败')
    }

    // 步骤4: 尝试访问Clients页面
    console.log('\n步骤4: 访问Clients页面')
    const clientRoutes = [
      '#/clients',
      '#/monitoring/clients',
      '#/connections/clients',
    ]

    for (const route of clientRoutes) {
      try {
        await page.goto(`${EMQX_DASHBOARD_URL}/${route}`, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(2000)

        const clientText = await page.evaluate(() => document.body.innerText)
        const hasContent = !clientText.includes('Login') && !clientText.includes('404') && !clientText.includes('Not Found')

        if (hasContent) {
          console.log(`\n成功访问 ${route}`)
          console.log(clientText.substring(0, 1500))
          await page.screenshot({ path: `test-results/diag/emqx-deep-07-${route.replace('#/', '')}.png`, fullPage: true })
          break
        }
      } catch {
        console.log(`路由 ${route} 访问失败`)
      }
    }

    // 步骤5: 保存完整HTML内容用于分析
    console.log('\n步骤5: 保存HTML内容')
    const finalHtml = await page.content()
    test.info().attachments.push({
      name: 'emqx-final-page.html',
      contentType: 'text/html',
      body: Buffer.from(finalHtml),
    })

    // 生成诊断报告
    const report = {
      timestamp: new Date().toISOString(),
      credentials: { username: EMQX_CREDENTIALS.username, passwordLength: EMQX_CREDENTIALS.password.length },
      urlsVisited: [
        EMQX_DASHBOARD_URL,
        `${EMQX_DASHBOARD_URL}/#/dashboard/overview`,
        `${EMQX_DASHBOARD_URL}/#/websocket`,
      ],
      pageContents: {
        overview: overviewText.substring(0, 500),
      },
      loginStatus: {
        initialUrl: currentUrl,
        finalUrl: page.url(),
        requiresLogin: isInLoginPage,
      },
    }

    test.info().attachments.push({
      name: 'emqx-deep-diagnostic-report.json',
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(report, null, 2)),
    })

    console.log('\n' + '='.repeat(80))
    console.log('诊断完成')
    console.log('='.repeat(80))
  })
})