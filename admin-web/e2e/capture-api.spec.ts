import { test } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(120000);

test('Debug - Capture actual API response', async ({ page }) => {
  console.log('\n' + '='.repeat(70));
  console.log('  拦截真实API响应');
  console.log('='.repeat(70) + '\n');

  // 登录
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('✓ 登录成功\n');

  // 拦截设备列表API响应
  const [devicesResponse] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes('/api/devices') &&
      resp.request().method() === 'GET' &&
      resp.status() === 200
    ),
    page.goto(`${PROD_URL}/devices`)
  ]);

  const devicesData = await devicesResponse.json();
  console.log('设备列表API响应:');
  console.log('  success:', devicesData.success);
  console.log('  total:', devicesData.total);
  console.log('  返回设备数:', devicesData.data?.length);

  // 检查每个设备的realtimeData
  let withTemp = 0;
  let withNull = 0;
  let noRealtime = 0;

  console.log('\n检查每个设备的realtimeData:');
  for (const device of devicesData.data || []) {
    if (device.realtimeData) {
      if (device.realtimeData.temperature !== null && device.realtimeData.temperature !== undefined) {
        withTemp++;
        console.log(`  ✓ ${device.id}: temp=${device.realtimeData.temperature}°C, recordedAt=${device.realtimeData.recordedAt}`);
      } else {
        withNull++;
      }
    } else {
      noRealtime++;
    }
  }

  console.log('\n统计:');
  console.log(`  有温度数据的设备: ${withTemp}`);
  console.log(`  realtimeData为NULL的设备: ${withNull}`);
  console.log(`  无realtimeData的设备: ${noRealtime}`);

  // 如果有温度数据，显示详情
  if (withTemp > 0) {
    const deviceWithTemp = devicesData.data.find(d => d.realtimeData?.temperature !== null);
    console.log(`\n检查第一个有温度的设备详情:`);
    console.log(`  设备ID: ${deviceWithTemp.id}`);
    console.log(`  完整realtimeData:`, JSON.stringify(deviceWithTemp.realtimeData, null, 4));

    // 检查设备详情API
    const [realtimeResponse] = await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes(`/api/devices/${deviceWithTemp.id}/realtime`) &&
        resp.status() === 200
      ),
      page.goto(`${PROD_URL}/devices/${deviceWithTemp.id}`)
    ]);

    const realtimeData = await realtimeResponse.json();
    console.log(`\n设备详情API /api/devices/${deviceWithTemp.id}/realtime:`);
    console.log(JSON.stringify(realtimeData, null, 2));

    // 检查页面显示
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').textContent();
    console.log('\n页面内容片段:');
    console.log(bodyText?.substring(bodyText.indexOf('实时数据'), bodyText.indexOf('实时数据') + 300));

    // 查找温度显示
    const tempMatches = bodyText?.match(/(\d+\.?\d*)\s*°C/g);
    if (tempMatches && tempMatches.length > 0) {
      console.log(`\n✓ 页面显示温度: ${tempMatches.join(', ')}`);
    } else {
      console.log('\n✗ 页面未显示温度数值');
      console.log('  可能显示: "-" 或 "暂无数据"');
    }
  }

  // 截图
  await page.screenshot({ path: 'test-results/capture-api-response.png', fullPage: true });
  console.log('\n截图保存: test-results/capture-api-response.png');
});