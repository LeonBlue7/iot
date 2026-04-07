import { test } from '@playwright/test';

const EMQX_URL = 'http://43.138.195.15:18083';
const EMQX_USER = 'admin';
const EMQX_PASS = 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=';

test.setTimeout(180000);

test('Explore EMQX Dashboard and Setup Auth', async ({ page }) => {
  console.log('=== 探索EMQX Dashboard ===\n');

  // 1. 登录
  console.log('1. 登录...');
  await page.goto(EMQX_URL);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').first().fill(EMQX_USER);
  await page.locator('input[type="password"]').first().fill(EMQX_PASS);
  await page.getByRole('button').first().click();
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  console.log('✓ 登录成功\n');

  // 等待页面加载
  await page.waitForTimeout(2000);

  // 2. 截图当前页面
  console.log('2. 分析Dashboard页面...');
  await page.screenshot({ path: '/tmp/iot-emqx-step1-dashboard.png', fullPage: true });

  // 获取侧边栏菜单
  const menuItems = await page.locator('[class*="menu"] a, [class*="nav"] a, nav a').allTextContents();
  console.log('菜单项:', menuItems.slice(0, 10).join(', '));

  // 3. 查找Authentication菜单
  console.log('\n3. 查找Authentication入口...');

  // 尝试不同的选择器
  const selectors = [
    'a:has-text("Authentication")',
    'a:has-text("认证")',
    '[href*="authentication"]',
    'text=/Authentication|认证/i'
  ];

  for (const selector of selectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`找到 ${count} 个匹配: ${selector}`);
      await page.locator(selector).first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      break;
    }
  }

  await page.screenshot({ path: '/tmp/iot-emqx-step2-auth-nav.png', fullPage: true });

  // 4. 获取当前URL
  const currentUrl = page.url();
  console.log('\n当前URL:', currentUrl);

  // 5. 尝试访问认证页面URL
  console.log('\n4. 尝试直接访问认证页面...');

  const authUrls = [
    '/#/authentication',
    '/#/authentication/password_based:built_in_database',
    '/#/authentication/built_in_database',
  ];

  for (const url of authUrls) {
    await page.goto(`${EMQX_URL}${url}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const title = await page.locator('h1, h2, [class*="title"]').first().textContent().catch(() => 'N/A');
    console.log(`URL: ${url} -> 标题: ${title}`);
  }

  // 截图最终状态
  await page.screenshot({ path: '/tmp/iot-emqx-step3-final.png', fullPage: true });

  // 6. 输出页面HTML结构帮助调试
  console.log('\n5. 页面主要内容...');
  const mainContent = await page.locator('main, [class*="content"], [class*="main"]').first().textContent().catch(() => 'N/A');
  console.log('主内容区(前500字符):', mainContent?.substring(0, 500));

  console.log('\n=== 完成 ===');
  console.log('截图保存在: /tmp/iot-emqx-step*.png');
});