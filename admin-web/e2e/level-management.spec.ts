import { test, expect } from './fixtures'

/**
 * 客户和分区管理功能验证测试
 */
test.describe('层级管理页面功能验证', () => {
  test('验证客户管理页面可访问', async ({ authenticatedPage }) => {
    // 访问客户管理页面
    await authenticatedPage.goto('/customers')
    await authenticatedPage.waitForLoadState('networkidle')

    // 验证页面标题
    const pageTitle = authenticatedPage.locator('h1')
    await expect(pageTitle).toHaveText('客户管理')

    // 验证新建按钮存在
    const createButton = authenticatedPage.locator('button', { hasText: '新建客户' })
    await expect(createButton).toBeVisible()

    // 验证表格存在
    const table = authenticatedPage.locator('.ant-table')
    await expect(table).toBeVisible()

    // 截图
    await authenticatedPage.screenshot({ path: 'test-results/customers-page.png', fullPage: true })

    console.log('客户管理页面验证通过')
  })

  test('验证分区管理页面可访问', async ({ authenticatedPage }) => {
    // 访问分区管理页面
    await authenticatedPage.goto('/zones')
    await authenticatedPage.waitForLoadState('networkidle')

    // 验证页面标题
    const pageTitle = authenticatedPage.locator('h1')
    await expect(pageTitle).toHaveText('分区管理')

    // 验证新建按钮存在
    const createButton = authenticatedPage.locator('button', { hasText: '新建分区' })
    await expect(createButton).toBeVisible()

    // 验证表格存在
    const table = authenticatedPage.locator('.ant-table')
    await expect(table).toBeVisible()

    // 截图
    await authenticatedPage.screenshot({ path: 'test-results/zones-page.png', fullPage: true })

    console.log('分区管理页面验证通过')
  })

  test('验证分组管理页面可访问', async ({ authenticatedPage }) => {
    // 访问分组管理页面
    await authenticatedPage.goto('/groups')
    await authenticatedPage.waitForLoadState('networkidle')

    // 验证页面标题
    const pageTitle = authenticatedPage.locator('h1')
    await expect(pageTitle).toHaveText('分组管理')

    // 验证新建按钮存在
    const createButton = authenticatedPage.locator('button', { hasText: '新建分组' })
    await expect(createButton).toBeVisible()

    // 验证表格存在
    const table = authenticatedPage.locator('.ant-table')
    await expect(table).toBeVisible()

    console.log('分组管理页面验证通过')
  })

  test('验证侧边栏层级树创建按钮', async ({ authenticatedPage }) => {
    // 访问仪表盘页面（侧边栏层级树可见）
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.waitForLoadState('networkidle')

    // 等待层级树加载
    const hierarchyTree = authenticatedPage.locator('.ant-tree')
    await hierarchyTree.waitFor({ state: 'visible', timeout: 10000 })

    // 展开第一个客户节点
    const firstExpandIcon = authenticatedPage.locator('.ant-tree-switcher_close').first()
    if (await firstExpandIcon.isVisible()) {
      await firstExpandIcon.click()
      await authenticatedPage.waitForTimeout(500)
    }

    // 验证客户节点有创建分区按钮（+图标）
    const createZoneBtn = authenticatedPage.locator('.ant-tree-node-content-wrapper').first().locator('.anticon-plus')
    await expect(createZoneBtn).toBeVisible()

    // 展开分区节点
    const zoneExpandIcon = authenticatedPage.locator('.ant-tree-switcher_close').filter({ has: authenticatedPage.locator('.anticon-appstore') }).first()
    if (await zoneExpandIcon.isVisible()) {
      await zoneExpandIcon.click()
      await authenticatedPage.waitForTimeout(500)

      // 验证分区节点有创建分组按钮（+图标）
      const createGroupBtn = authenticatedPage.locator('.ant-tree-node-content-wrapper').filter({ has: authenticatedPage.locator('.anticon-folder') }).first().locator('.anticon-plus')
      if (await createGroupBtn.isVisible()) {
        console.log('层级树创建按钮验证通过')
      }
    }

    // 截图
    await authenticatedPage.screenshot({ path: 'test-results/hierarchy-create-buttons.png', fullPage: true })
  })

  test('验证导航菜单包含所有层级入口', async ({ authenticatedPage }) => {
    // 访问仪表盘
    await authenticatedPage.goto('/dashboard')
    await authenticatedPage.waitForLoadState('networkidle')

    // 验证导航菜单项
    const menuItems = ['客户管理', '分区管理', '分组管理', '设备管理']

    for (const item of menuItems) {
      const menuItem = authenticatedPage.locator('.ant-menu-item', { hasText: item })
      await expect(menuItem).toBeVisible()
      console.log(`导航菜单项 ${item} 验证通过`)
    }

    // 截图
    await authenticatedPage.screenshot({ path: 'test-results/navigation-menu.png', fullPage: true })
  })
})