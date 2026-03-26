# 微信小程序 E2E 测试方案

微信小程序由于其专有平台特性，无法直接使用 Playwright 进行测试。以下是推荐的测试方案：

## 方案一：使用 miniprogram-automator（官方工具）

微信官方提供了小程序自动化测试工具 `miniprogram-automator`，可以实现对小程序的自动化测试。

### 安装

```bash
npm install miniprogram-automator --save-dev
```

### 配置

```javascript
// miniprogram-automator.config.js
module.exports = {
  cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
  projectPath: '/home/leon/projects/iot/miniprogram',
}
```

### 测试示例

```javascript
// miniprogram/e2e/login.test.js
const automator = require('miniprogram-automator')

describe('登录测试', () => {
  let miniProgram

  beforeAll(async () => {
    miniProgram = await automator.launch({
      cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      projectPath: '/home/leon/projects/iot/miniprogram',
    })
  }, 60000)

  afterAll(async () => {
    if (miniProgram) {
      await miniProgram.close()
    }
  })

  it('用户名密码登录', async () => {
    const page = await miniProgram.reLaunch('/pages/login/login')
    await page.waitFor(1000)

    // 输入用户名
    const usernameInput = await page.$('input[placeholder="请输入用户名"]')
    await usernameInput.input('admin')

    // 输入密码
    const passwordInput = await page.$('input[placeholder="请输入密码"]')
    await passwordInput.input('admin123')

    // 点击登录按钮
    const loginButton = await page.$('button:contains("登录")')
    await loginButton.tap()

    // 等待登录完成
    await page.waitFor(2000)

    // 验证跳转到首页
    const currentPage = await miniProgram.currentPage()
    expect(currentPage.path).toContain('pages/index/index')
  })
})
```

### 设备控制测试示例

```javascript
// miniprogram/e2e/device.test.js
describe('设备控制测试', () => {
  let miniProgram
  let page

  beforeAll(async () => {
    miniProgram = await automator.launch({
      cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      projectPath: '/home/leon/projects/iot/miniprogram',
    })
  }, 60000)

  beforeEach(async () => {
    // 先登录
    page = await miniProgram.reLaunch('/pages/login/login')
    await page.waitFor(1000)

    const usernameInput = await page.$('input[placeholder="请输入用户名"]')
    await usernameInput.input('admin')

    const passwordInput = await page.$('input[placeholder="请输入密码"]')
    await passwordInput.input('admin123')

    const loginButton = await page.$('button')
    await loginButton.tap()
    await page.waitFor(2000)
  })

  afterAll(async () => {
    if (miniProgram) {
      await miniProgram.close()
    }
  })

  it('查看设备详情', async () => {
    // 导航到设备页面
    page = await miniProgram.reLaunch('/pages/index/index')
    await page.waitFor(1000)

    // 点击第一个设备
    const deviceItem = await page.$('.device-item')
    if (deviceItem) {
      await deviceItem.tap()
      await page.waitFor(1000)

      // 验证进入设备详情页
      const currentPage = await miniProgram.currentPage()
      expect(currentPage.path).toContain('/pages/device/device')
    }
  })

  it('控制空调开关', async () => {
    // 导航到设备控制页
    page = await miniProgram.reLaunch('/pages/device/device?id=test-device-id')
    await page.waitFor(1000)

    // 点击控制按钮
    const controlButton = await page.$('.control-btn')
    if (controlButton) {
      await controlButton.tap()
      await page.waitFor(500)

      // 切换开关
      const switchButton = await page.$('.switch-btn')
      await switchButton.tap()
      await page.waitFor(1000)

      // 验证操作成功提示
      // ...
    }
  })
})
```

## 方案二：测试后端 API

由于小程序的核心业务逻辑都在后端 API，可以直接测试后端 API 接口。

### API 测试示例

```typescript
// backend/tests/api/devices.test.ts
import { test, expect } from '@playwright/test'

test.describe('设备 API', () => {
  let authToken: string

  test.beforeAll(async ({ request }) => {
    // 获取认证token
    const response = await request.post('http://localhost:3000/api/auth/login', {
      data: { username: 'admin', password: 'admin123' },
    })
    const data = await response.json()
    authToken = data.token
  })

  test('获取设备列表', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/devices', {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('控制设备', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/devices/test-id/control', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { action: 'on' },
    })

    expect(response.ok()).toBeTruthy()
  })
})
```

## 方案三：单元测试 + 集成测试

小程序已有的单元测试（如 `pages/login/login.test.ts`）应该继续维护，确保组件和页面逻辑正确。

### 运行单元测试

```bash
cd miniprogram
npm test
```

## 推荐的测试策略

1. **后端 API 测试**（优先级最高）
   - 使用 Playwright 测试所有后端 API
   - 确保核心业务逻辑正确

2. **小程序单元测试**（优先级高）
   - 测试页面组件和工具函数
   - 已有的 Jest 测试继续维护

3. **小程序自动化测试**（优先级中）
   - 使用 miniprogram-automator
   - 需要 macOS 环境和微信开发者工具
   - 测试关键用户流程

4. **端到端集成测试**
   - 结合 API 测试和 UI 测试
   - 验证完整业务流程

## CI/CD 集成

```yaml
# .github/workflows/miniprogram-test.yml
name: Miniprogram Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend
          npm install

      - name: Run API tests
        run: |
          cd backend
          npm run test

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd miniprogram
          npm install

      - name: Run unit tests
        run: |
          cd miniprogram
          npm test

  # 小程序自动化测试需要 macOS 环境
  automator-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install WeChat DevTools
        run: |
          brew install --cask wechatwebdevtools

      - name: Install dependencies
        run: |
          cd miniprogram
          npm install

      - name: Run automator tests
        run: |
          cd miniprogram
          npm run test:e2e
```

## 参考资源

- [miniprogram-automator 官方文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/)
- [小程序自动化测试最佳实践](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/quick-start.html)