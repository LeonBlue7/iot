# E2E 测试文档

## 测试概述

本项目使用 Playwright 进行端到端测试，覆盖管理后台的核心功能。

## 测试范围

### 管理后台 (admin-web)

| 模块 | 测试文件 | 测试场景 |
|------|----------|----------|
| 登录 | `auth.spec.ts` | 页面加载、成功登录、失败登录、表单验证 |
| 仪表盘 | `dashboard.spec.ts` | 统计数据显示、最近告警、响应式布局 |
| 设备管理 | `devices.spec.ts` | 设备列表、详情、编辑、控制 |
| 告警管理 | `alarms.spec.ts` | 告警列表、确认告警、状态显示 |

### 微信小程序

由于微信小程序是专有平台，无法直接使用 Playwright 测试。推荐使用：

1. **miniprogram-automator** - 微信官方自动化测试工具
2. **后端 API 测试** - 测试小程序调用的所有 API
3. **单元测试** - 已有的 Jest 测试

详见 [小程序测试方案](../docs/miniprogram-testing.md)

## 运行测试

### 前置条件

1. 确保后端服务运行在 `http://localhost:3000`
2. 确保前端服务运行在 `http://localhost:3001`
3. 确保有测试用户 `admin/admin123`

### 运行所有测试

```bash
cd admin-web

# 安装 Playwright 浏览器（首次运行）
npx playwright install

# 运行所有测试
npm run test:e2e

# 使用 UI 模式
npm run test:e2e:ui

# 有头模式（可以看到浏览器）
npm run test:e2e:headed
```

### 运行特定测试

```bash
# 运行登录测试
npx playwright test auth

# 运行设备管理测试
npx playwright test devices

# 运行特定文件
npx playwright test e2e/auth.spec.ts
```

### 调试测试

```bash
# 调试模式
npx playwright test --debug

# 查看测试报告
npx playwright show-report
```

## 测试结构

```
admin-web/e2e/
├── pages/                    # Page Object Model
│   ├── LoginPage.ts          # 登录页面
│   ├── DashboardPage.ts      # 仪表盘页面
│   ├── DevicesPage.ts        # 设备管理页面
│   ├── AlarmsPage.ts         # 告警管理页面
│   └── index.ts              # 导出
├── helpers/                  # 辅助函数
│   └── auth.ts               # 认证辅助
├── fixtures.ts               # 测试 fixtures
├── auth.setup.ts             # 认证设置
├── auth.spec.ts              # 登录测试
├── dashboard.spec.ts         # 仪表盘测试
├── devices.spec.ts           # 设备管理测试
└── alarms.spec.ts            # 告警管理测试
```

## Page Object Model

使用 Page Object Model 模式提高测试可维护性：

```typescript
// 使用示例
import { LoginPage } from './pages'

test('登录测试', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('admin', 'admin123')
  await loginPage.expectLoginSuccess()
})
```

## 认证处理

测试使用 `fixtures.ts` 中定义的 `authenticatedPage` fixture，自动处理登录：

```typescript
import { test, expect } from '../fixtures'

test('需要登录的测试', async ({ authenticatedPage }) => {
  // authenticatedPage 已经登录
  await authenticatedPage.goto('/devices')
  // ...
})
```

## CI/CD 集成

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: iot_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../admin-web && npm install

      - name: Install Playwright
        run: cd admin-web && npx playwright install --with-deps

      - name: Setup database
        run: cd backend && npx prisma migrate deploy

      - name: Start backend
        run: cd backend && npm run dev &

      - name: Start frontend
        run: cd admin-web && npm run dev &

      - name: Wait for services
        run: npx wait-on http://localhost:3000 http://localhost:3001

      - name: Run E2E tests
        run: cd admin-web && npm run test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: admin-web/playwright-report/
```

## 测试报告

测试完成后，报告保存在 `playwright-report/` 目录：

```bash
# 查看报告
npx playwright show-report
```

### 失败时生成的文件

- **截图**: `test-results/` 目录下的 `.png` 文件
- **视频**: `test-results/` 目录下的 `.webm` 文件
- **追踪**: `test-results/` 目录下的 `.zip` 文件

## 最佳实践

1. **使用 data-testid**: 为关键元素添加 `data-testid` 属性
2. **等待网络请求**: 使用 `waitForResponse` 而非固定等待
3. **独立测试**: 每个测试应独立，不依赖其他测试
4. **清理数据**: 测试后清理创建的数据
5. **有意义的断言**: 断言应验证业务逻辑

## 常见问题

### 测试超时

```typescript
// 增加单个测试超时
test('慢测试', async ({ page }) => {
  // ...
}, { timeout: 30000 })
```

### 元素不可见

```typescript
// 等待元素可见
await page.locator('.element').waitFor({ state: 'visible' })
```

### 网络请求失败

```typescript
// 等待特定请求完成
await page.waitForResponse(resp =>
  resp.url().includes('/api/devices') && resp.status() === 200
)
```