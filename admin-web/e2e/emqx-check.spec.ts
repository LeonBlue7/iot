import { test } from '@playwright/test';

const EMQX_URL = 'http://43.138.195.15:18083';
const EMQX_USER = 'admin';
const EMQX_PASS = 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=';

test.setTimeout(60000);

test('Check EMQX authentication status', async ({ page }) => {
  console.log('\n========================================');
  console.log('  EMQX配置状态检查');
  console.log('========================================\n');

  // 1. 登录
  console.log('[1] 登录EMQX Dashboard...');
  await page.goto(EMQX_URL);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').first().fill(EMQX_USER);
  await page.locator('input[type="password"]').first().fill(EMQX_PASS);
  await page.getByRole('button').first().click();
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  console.log('  ✓ 登录成功\n');
  await page.screenshot({ path: '/tmp/emqx-01-dashboard.png', fullPage: true });

  // 2. 检查认证器
  console.log('[2] 检查认证器配置...');
  await page.goto(`${EMQX_URL}/#/authentication`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/emqx-02-authentication.png', fullPage: true });

  // 检查是否有Password-Based认证器
  const authRows = await page.locator('tr, [class*="card"]').filter({ hasText: /password-based/i }).count();
  console.log(`  认证器数量: ${authRows}`);

  if (authRows > 0) {
    console.log('  ✓ Password-Based认证器已存在\n');
    // 点击进入查看用户
    await page.locator('tr, [class*="card"]').filter({ hasText: /password-based/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 点击Users标签
    const usersTab = page.locator('[role="tab"], button').filter({ hasText: /users/i });
    if (await usersTab.count() > 0) {
      await usersTab.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: '/tmp/emqx-03-users.png', fullPage: true });

    // 检查test1用户
    const test1Exists = await page.locator('text=test1').count();
    console.log(`  test1用户存在: ${test1Exists > 0 ? '✓ 是' : '✗ 否'}\n`);
  } else {
    console.log('  ✗ 未找到Password-Based认证器\n');
  }

  // 3. 检查监听器
  console.log('[3] 检查TCP监听器...');
  await page.goto(`${EMQX_URL}/#/listeners`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/emqx-04-listeners.png', fullPage: true });

  const tcpRow = page.locator('tr').filter({ hasText: /1883/ });
  if (await tcpRow.count() > 0) {
    const tcpText = await tcpRow.first().textContent();
    console.log(`  TCP监听器信息: ${tcpText?.substring(0, 50)}...\n`);
  }

  // 4. 检查客户端连接
  console.log('[4] 检查客户端连接...');
  await page.goto(`${EMQX_URL}/#/clients`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/emqx-05-clients.png', fullPage: true });

  // 统计连接数
  const clientRows = await page.locator('tbody tr').count();
  console.log(`  当前连接数: ${clientRows}`);

  // 检查是否有后端客户端(iot_server)
  const backendClient = await page.locator('text=/iot_server|backend/').count();
  console.log(`  后端MQTT客户端: ${backendClient > 0 ? '✓ 已连接' : '✗ 未连接'}\n`);

  console.log('========================================');
  console.log('  检查完成');
  console.log('========================================');
  console.log('\n截图保存位置:');
  console.log('  /tmp/emqx-01-dashboard.png');
  console.log('  /tmp/emqx-02-authentication.png');
  console.log('  /tmp/emqx-03-users.png');
  console.log('  /tmp/emqx-04-listeners.png');
  console.log('  /tmp/emqx-05-clients.png');
  console.log('\n');
});