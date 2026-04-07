import { test } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(120000);

test('Debug - Check raw API response and UI', async ({ page }) => {
  console.log('\n' + '='.repeat(70));
  console.log('  生产环境实时数据调试');
  console.log('='.repeat(70) + '\n');

  // ========== 登录 ==========
  console.log('[1] 登录...');
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('  ✓ 登录成功\n');

  // ========== 直接调用API检查原始数据 ==========
  console.log('[2] 检查设备列表API原始响应...');

  const apiResponse = await page.evaluate(async () => {
    const resp = await fetch('/api/devices?page=1&limit=10&includeRealtime=true');
    const data = await resp.json();
    return data;
  });

  console.log('  API响应成功:', apiResponse.success);
  console.log('  设备总数:', apiResponse.total);
  console.log('  返回设备数:', apiResponse.data?.length);

  // 打印每个设备的realtimeData
  console.log('\n  检查每个设备的realtimeData:');
  for (const device of apiResponse.data || []) {
    console.log(`\n  设备 ${device.id}:`);
    console.log(`    name: ${device.name}`);
    console.log(`    online: ${device.online}`);
    console.log(`    realtimeData存在: ${device.realtimeData ? 'YES' : 'NO'}`);

    if (device.realtimeData) {
      console.log(`    realtimeData内容:`);
      console.log(`      temperature: ${device.realtimeData.temperature} (类型: ${typeof device.realtimeData.temperature})`);
      console.log(`      humidity: ${device.realtimeData.humidity} (类型: ${typeof device.realtimeData.humidity})`);
      console.log(`      current: ${device.realtimeData.current}`);
      console.log(`      recordedAt: ${device.realtimeData.recordedAt}`);
    }
  }

  // ========== 统计有温度数据的设备 ==========
  const devicesWithTemp = apiResponse.data?.filter(d =>
    d.realtimeData?.temperature !== null &&
    d.realtimeData?.temperature !== undefined
  ) || [];

  console.log(`\n  有温度数据的设备数: ${devicesWithTemp.length}`);

  if (devicesWithTemp.length > 0) {
    console.log('\n  有温度数据的设备列表:');
    devicesWithTemp.forEach(d => {
      console.log(`    ${d.id}: ${d.realtimeData.temperature}°C (记录时间: ${d.realtimeData.recordedAt})`);
    });
  }

  // ========== 导航到设备页面检查UI显示 ==========
  console.log('\n[3] 检查设备列表页面UI...');
  await page.goto(`${PROD_URL}/devices`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 检查表格
  const rows = await page.locator('.ant-table-tbody tr').all();
  console.log(`  表格行数: ${rows.length}`);

  // 检查第一行内容
  if (rows.length > 0) {
    const firstRow = rows[0];
    const cells = await firstRow.locator('td').all();
    console.log('\n  第一行表格内容:');
    for (let i = 0; i < cells.length; i++) {
      const text = await cells[i].textContent();
      console.log(`    列${i}: "${text?.trim()}"`);
    }
  }

  // ========== 如果有设备有温度数据，检查详情页 ==========
  if (devicesWithTemp.length > 0) {
    const testDevice = devicesWithTemp[0];
    console.log(`\n[4] 检查设备详情页 (${testDevice.id})...`);

    await page.goto(`${PROD_URL}/devices/${testDevice.id}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 检查实时数据卡片
    const realtimeCard = page.locator('.ant-card').filter({ hasText: '实时数据' });
    const cardText = await realtimeCard.textContent();
    console.log('\n  实时数据卡片内容:');
    console.log(`    ${cardText?.substring(0, 300)}`);

    // 查找温度显示
    const tempText = await page.locator('body').textContent();
    const tempMatch = tempText?.match(/(\d+\.?\d*)\s*°C/);
    if (tempMatch) {
      console.log(`\n  ✓ 找到温度显示: ${tempMatch[0]}`);
    } else {
      console.log('\n  ✗ 未找到温度数值显示');
      console.log('  页面可能显示: "-" 或 "暂无数据"');
    }
  }

  // ========== 截图 ==========
  await page.screenshot({ path: 'test-results/debug-api-check.png', fullPage: true });
  console.log('\n截图保存: test-results/debug-api-check.png');

  console.log('\n' + '='.repeat(70));
  console.log('  调试完成');
  console.log('='.repeat(70));
});