import { test } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(120000);

test('Debug - Full API response', async ({ page }) => {
  console.log('\n' + '='.repeat(70));
  console.log('  检查完整API响应');
  console.log('='.repeat(70) + '\n');

  // 登录
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('✓ 登录成功\n');

  // 获取完整的API响应
  const apiResponse = await page.evaluate(async () => {
    const resp = await fetch('/api/devices?page=1&limit=10&includeRealtime=true');
    const data = await resp.json();
    return {
      status: resp.status,
      statusText: resp.statusText,
      body: data
    };
  });

  console.log('HTTP状态:', apiResponse.status, apiResponse.statusText);
  console.log('\n完整响应体:');
  console.log(JSON.stringify(apiResponse.body, null, 2));

  // 尝试另一个API
  console.log('\n' + '-'.repeat(50));
  console.log('检查 /api/stats/overview...');

  const statsResponse = await page.evaluate(async () => {
    const resp = await fetch('/api/stats/overview');
    const data = await resp.json();
    return {
      status: resp.status,
      body: data
    };
  });

  console.log('HTTP状态:', statsResponse.status);
  console.log('响应体:', JSON.stringify(statsResponse.body, null, 2));

  // 检查设备详情API
  console.log('\n' + '-'.repeat(50));
  console.log('检查 /api/devices/866965081752518/realtime...');

  const realtimeResponse = await page.evaluate(async () => {
    const resp = await fetch('/api/devices/866965081752518/realtime');
    const data = await resp.json();
    return {
      status: resp.status,
      body: data
    };
  });

  console.log('HTTP状态:', realtimeResponse.status);
  console.log('响应体:', JSON.stringify(realtimeResponse.body, null, 2));

  // 检查登录状态
  console.log('\n' + '-'.repeat(50));
  console.log('检查 /api/admin/auth/me...');

  const authResponse = await page.evaluate(async () => {
    const resp = await fetch('/api/admin/auth/me');
    const data = await resp.json();
    return {
      status: resp.status,
      body: data
    };
  });

  console.log('HTTP状态:', authResponse.status);
  console.log('响应体:', JSON.stringify(authResponse.body, null, 2));
});