/**
 * 生产环境认证诊断测试
 *
 * 诊断步骤：
 * 1. 访问 https://www.jxbonner.cloud/login
 * 2. 登录并检查 localStorage
 * 3. 等待页面跳转后的自动API请求
 * 4. 检查 API 请求的 Authorization header
 * 5. 手动刷新页面检查持久化
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'https://www.jxbonner.cloud'
const LOGIN_URL = `${BASE_URL}/login`

// 测试账号
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'OGhinH+f/Ey1Ysf+MRQ1qA==',
}

interface ApiRequestLog {
  url: string
  method: string
  authHeader: string | undefined
  status: number
  responseBody: unknown
  timestamp: string
}

interface AuthStorage {
  state: {
    token: string | null
    user: {
      id: number
      username: string
      email: string
      name: string
      permissions: string[]
    } | null
    isAuthenticated: boolean
  }
  version: number
}

test.describe('生产环境认证诊断', () => {
  test('完整认证流程诊断', async ({ page }) => {
    // 用于存储所有API请求信息
    const allApiRequests: ApiRequestLog[] = []

    // 监听所有网络请求
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        console.log(`[REQUEST] ${request.method()} ${request.url()}`)
        const auth = request.headers()['authorization']
        console.log(`  Authorization: ${auth || '未携带'}`)
      }
    })

    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/api/')) {
        const request = response.request()
        const authHeader = request.headers()['authorization']
        let responseBody: unknown = null
        try {
          responseBody = await response.json()
        } catch {
          // 忽略非 JSON 响应
        }
        allApiRequests.push({
          url,
          method: request.method(),
          authHeader,
          status: response.status(),
          responseBody,
          timestamp: new Date().toISOString(),
        })
        console.log(`[RESPONSE] ${response.status()} ${url}`)
        if (responseBody) {
          const bodyStr = JSON.stringify(responseBody)
          console.log(`  Body: ${bodyStr.substring(0, 300)}${bodyStr.length > 300 ? '...' : ''}`)
        }
      }
    })

    // ===== 步骤1: 访问登录页 =====
    console.log('\n' + '='.repeat(60))
    console.log('步骤1: 访问登录页面')
    console.log('='.repeat(60))
    await page.goto(LOGIN_URL)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/diag/01-login-page.png', fullPage: true })

    // 检查登录表单
    const usernameInput = page.locator('input[type="text"], input#username, input[name="username"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const loginButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first()

    await expect(usernameInput).toBeVisible({ timeout: 10000 })
    await expect(passwordInput).toBeVisible()
    await expect(loginButton).toBeVisible()
    console.log('登录表单已找到')

    // ===== 步骤2: 执行登录 =====
    console.log('\n' + '='.repeat(60))
    console.log('步骤2: 执行登录')
    console.log('='.repeat(60))
    await usernameInput.fill(TEST_CREDENTIALS.username)
    await passwordInput.fill(TEST_CREDENTIALS.password)

    // 点击登录
    await loginButton.click()

    // 等待登录API响应和页面跳转
    console.log('等待登录响应和页面跳转...')
    try {
      await page.waitForResponse(
        (response) => response.url().includes('/api/admin/auth/login'),
        { timeout: 15000 }
      )
      console.log('登录API响应已接收')
    } catch {
      console.log('警告: 等待登录API响应超时')
    }

    // 等待URL变化
    try {
      await page.waitForURL('**/dashboard**', { timeout: 10000 })
      console.log('页面已跳转到dashboard')
    } catch {
      console.log('警告: 未检测到跳转到dashboard')
    }

    // 等待所有网络请求完成
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const currentUrl = page.url()
    console.log(`当前URL: ${currentUrl}`)
    await page.screenshot({ path: 'test-results/diag/02-after-login.png', fullPage: true })

    // ===== 步骤3: 检查 localStorage =====
    console.log('\n' + '='.repeat(60))
    console.log('步骤3: 检查 localStorage')
    console.log('='.repeat(60))
    const authStorageStr = await page.evaluate(() => {
      return localStorage.getItem('auth-storage')
    })

    let authStorage: AuthStorage | null = null
    if (authStorageStr) {
      try {
        authStorage = JSON.parse(authStorageStr)
        console.log('auth-storage 内容:')
        console.log(JSON.stringify(authStorage, null, 2))

        if (authStorage?.state?.token) {
          console.log(`\nToken 存在!`)
          console.log(`  长度: ${authStorage.state.token.length}`)
          console.log(`  前30字符: ${authStorage.state.token.substring(0, 30)}...`)
        } else {
          console.log('\n警告: Token 不存在于 auth-storage 中!')
        }
      } catch (e) {
        console.log(`解析 auth-storage 失败: ${e}`)
      }
    } else {
      console.log('警告: auth-storage 不存在于 localStorage!')
    }

    // ===== 步骤4: 分析登录后的所有API请求 =====
    console.log('\n' + '='.repeat(60))
    console.log('步骤4: 分析登录后的所有API请求')
    console.log('='.repeat(60))
    console.log(`总共捕获 ${allApiRequests.length} 个API请求:\n`)

    const requestsWithMissingAuth: ApiRequestLog[] = []
    const requestsWith401: ApiRequestLog[] = []

    for (const req of allApiRequests) {
      const isLoginApi = req.url.includes('/api/admin/auth/login')
      console.log(`--- ${req.method} ${req.url} ---`)
      console.log(`  状态: ${req.status}`)
      console.log(`  Authorization: ${req.authHeader || '未携带'}`)

      if (!isLoginApi && !req.authHeader) {
        console.log('  [!] 非登录请求但未携带 Authorization header!')
        requestsWithMissingAuth.push(req)
      }

      if (req.status === 401) {
        console.log('  [!] 返回 401 未授权!')
        requestsWith401.push(req)
      }

      if (req.responseBody && typeof req.responseBody === 'object') {
        const body = req.responseBody as Record<string, unknown>
        if ('error' in body) {
          console.log(`  错误信息: ${body.error}`)
        }
      }
      console.log('')
    }

    // ===== 步骤5: 刷新页面检查持久化 =====
    console.log('\n' + '='.repeat(60))
    console.log('步骤5: 刷新页面检查Token持久化')
    console.log('='.repeat(60))
    allApiRequests.length = 0 // 清空以记录刷新后的请求

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // 再次检查 localStorage
    const authStorageAfterRefresh = await page.evaluate(() => {
      return localStorage.getItem('auth-storage')
    })
    console.log(`刷新后 auth-storage 存在: ${authStorageAfterRefresh ? '是' : '否'}`)

    if (authStorageAfterRefresh) {
      const parsed = JSON.parse(authStorageAfterRefresh)
      console.log(`刷新后 Token 存在: ${parsed?.state?.token ? '是' : '否'}`)
    }

    // 分析刷新后的请求
    console.log(`\n刷新后捕获 ${allApiRequests.length} 个API请求:`)
    for (const req of allApiRequests) {
      console.log(`  ${req.method} ${req.url}`)
      console.log(`    状态: ${req.status}, Auth: ${req.authHeader ? '有' : '无'}`)
    }

    await page.screenshot({ path: 'test-results/diag/03-after-refresh.png', fullPage: true })

    // ===== 步骤6: 点击设备菜单 =====
    console.log('\n' + '='.repeat(60))
    console.log('步骤6: 点击设备菜单触发API请求')
    console.log('='.repeat(60))
    allApiRequests.length = 0

    // 查找设备菜单
    const deviceMenu = page.locator('a:has-text("设备"), a:has-text("Device"), [data-menu-id="devices"]').first()
    const isDeviceMenuVisible = await deviceMenu.isVisible().catch(() => false)

    if (isDeviceMenuVisible) {
      console.log('找到设备菜单，点击...')
      await deviceMenu.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      console.log(`点击设备菜单后捕获 ${allApiRequests.length} 个API请求:`)
      for (const req of allApiRequests) {
        console.log(`  ${req.method} ${req.url}`)
        console.log(`    状态: ${req.status}, Auth: ${req.authHeader ? '有' : '无'}`)
        if (req.status === 401 || (req.responseBody && typeof req.responseBody === 'object' && 'error' in (req.responseBody as Record<string, unknown>))) {
          console.log(`    响应: ${JSON.stringify(req.responseBody)}`)
        }
      }

      await page.screenshot({ path: 'test-results/diag/04-after-device-click.png', fullPage: true })
    } else {
      console.log('未找到设备菜单')
      // 尝试打印页面结构
      const pageContent = await page.content()
      console.log('页面中包含"设备"文字的元素:')
      const deviceElements = await page.locator(':text("设备")').all()
      console.log(`找到 ${deviceElements.length} 个包含"设备"的元素`)
    }

    // ===== 步骤7: 检查页面错误 =====
    console.log('\n' + '='.repeat(60))
    console.log('步骤7: 检查页面错误提示')
    console.log('='.repeat(60))
    const errorMessages = await page.locator('.ant-message-error, .ant-alert-error, [role="alert"], .ant-notification-error').allTextContents()
    if (errorMessages.length > 0) {
      console.log('页面错误信息:')
      errorMessages.forEach(msg => console.log(`  - ${msg}`))
    } else {
      console.log('未发现明显的页面错误提示')
    }

    // ===== 生成诊断报告 =====
    console.log('\n' + '='.repeat(60))
    console.log('诊断报告')
    console.log('='.repeat(60))
    console.log(`登录状态: ${currentUrl.includes('/login') ? '失败(仍在登录页)' : '成功(已跳转)'}`)
    console.log(`Token存储: ${authStorage?.state?.token ? '正常' : '异常(无Token)'}`)
    console.log(`未携带Auth的请求: ${requestsWithMissingAuth.length}`)
    console.log(`返回401的请求: ${requestsWith401.length}`)

    if (requestsWithMissingAuth.length > 0) {
      console.log('\n[问题根因] 以下请求未携带Authorization header:')
      for (const req of requestsWithMissingAuth) {
        console.log(`  - ${req.method} ${req.url}`)
      }
    }

    // 保存完整报告
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        loginSuccess: !currentUrl.includes('/login'),
        tokenExists: !!authStorage?.state?.token,
        requestWithoutAuth: requestsWithMissingAuth.length,
        requestWith401: requestsWith401.length,
      },
      authStorage: authStorage,
      allApiRequests: allApiRequests,
      requestsWithMissingAuth,
      requestsWith401,
      errorMessages,
      pageUrl: currentUrl,
    }

    test.info().attachments.push({
      name: 'diagnostic-report.json',
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(report, null, 2)),
    })

    // 如果发现问题，打印关键信息
    if (requestsWithMissingAuth.length > 0 || requestsWith401.length > 0) {
      console.log('\n[诊断结论]')
      if (!authStorage?.state?.token) {
        console.log('Token未正确保存到localStorage')
      } else if (requestsWithMissingAuth.length > 0) {
        console.log('Token存在但API请求未携带Authorization header')
        console.log('可能原因: axios拦截器未正确读取localStorage中的token')
      }
    }
  })
})