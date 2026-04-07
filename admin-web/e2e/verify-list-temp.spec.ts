import { test } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(120000);

test('Verify device list temperature display', async ({ page }) => {
  console.log('\n' + '='.repeat(70));
  console.log('  验证设备列表温度显示');
  console.log('='.repeat(70) + '\n');

  // 登录
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('✓ 登录成功\n');

  // 获取API响应
  const [devicesResponse] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes('/api/devices') &&
      resp.request().method() === 'GET' &&
      resp.status() === 200
    ),
    page.goto(`${PROD_URL}/devices`)
  ]);

  const devicesData = await devicesResponse.json();

  // 找到有温度的设备
  const devicesWithTemp = devicesData.data?.filter(d =>
    d.realtimeData?.temperature !== null &&
    d.realtimeData?.temperature !== undefined
  ) || [];

  console.log(`有温度数据的设备: ${devicesWithTemp.length}台\n`);

  // 检查表格显示
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 检查每个有温度的设备在表格中的显示
  for (const device of devicesWithTemp.slice(0, 5)) {
    const expectedTemp = Number(device.realtimeData.temperature).toFixed(1);

    // 找到这一行
    const row = page.locator(`tr:has-text("${device.id}")`);
    const cells = await row.locator('td').allTextContents();

    // 温度列是第4列（索引3）
    const tempColumn = cells[3]?.trim();

    console.log(`设备 ${device.id}:`);
    console.log(`  API温度: ${device.realtimeData.temperature}°C`);
    console.log(`  期望显示: ${expectedTemp}°C`);
    console.log(`  表格显示: "${tempColumn}"`);

    if (tempColumn && tempColumn !== '-' && tempColumn !== '') {
      console.log(`  ✓ 温度正确显示`);
    } else {
      console.log(`  ✗ 温度未显示`);
    }
    console.log('');
  }

  // 截图
  await page.screenshot({ path: 'test-results/device-list-temp.png', fullPage: true });
  console.log('截图保存: test-results/device-list-temp.png');
});