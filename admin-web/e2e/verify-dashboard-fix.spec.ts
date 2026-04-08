import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(180000);

test('验证Dashboard修复', async ({ page }) => {
  console.log('\n' + '='.repeat(80));
  console.log('  验证Dashboard设备总数显示修复');
  console.log('  (修复前: limit=200导致API返回400错误)');
  console.log('='.repeat(80) + '\n');

  // 登录
  console.log('[步骤 1] 登录');
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('  登录成功');

  // 捕获所有API请求
  console.log('\n[步骤 2] 导航到Dashboard并捕获API请求');
  const apiCalls: { url: string; status: number }[] = [];

  page.on('response', (response) => {
    if (response.url().includes('/api/devices')) {
      apiCalls.push({
        url: response.url(),
        status: response.status()
      });
      console.log(`  设备API: ${response.url().split('/api/')[1]} -> ${response.status()}`);
    }
  });

  await page.goto(`${PROD_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // 检查设备API调用状态
  console.log('\n[步骤 3] 分析设备API调用');
  const failedCalls = apiCalls.filter(c => c.status !== 200);
  const successCalls = apiCalls.filter(c => c.status === 200);

  console.log('  成功的设备API调用:', successCalls.length);
  console.log('  失败的设备API调用:', failedCalls.length);

  if (failedCalls.length > 0) {
    console.log('  失败的API详情:');
    failedCalls.forEach(c => console.log(`    ${c.url} -> ${c.status}`));
  }

  // 检查页面显示
  console.log('\n[步骤 4] 检查页面统计卡片');
  await page.waitForTimeout(2000);

  const totalDevicesEl = page.locator('.ant-statistic').filter({ hasText: '设备总数' }).locator('.ant-statistic-content-value');
  const onlineDevicesEl = page.locator('.ant-statistic').filter({ hasText: '在线设备' }).locator('.ant-statistic-content-value');
  const offlineDevicesEl = page.locator('.ant-statistic').filter({ hasText: '离线设备' }).locator('.ant-statistic-content-value');
  const acPowerOnEl = page.locator('.ant-statistic').filter({ hasText: '空调开机' }).locator('.ant-statistic-content-value');

  const totalDevices = await totalDevicesEl.textContent() || '0';
  const onlineDevices = await onlineDevicesEl.textContent() || '0';
  const offlineDevices = await offlineDevicesEl.textContent() || '0';
  const acPowerOn = await acPowerOnEl.textContent() || '0';

  console.log('  设备总数:', totalDevices);
  console.log('  在线设备:', onlineDevices);
  console.log('  离线设备:', offlineDevices);
  console.log('  空调开机:', acPowerOn);

  // 结果判断
  console.log('\n[步骤 5] 测试结果');

  const total = parseInt(totalDevices) || 0;

  if (total === 0) {
    console.log('  ✗ Bug仍存在: 设备总数显示为0');
    console.log('  原因分析:');
    if (failedCalls.length > 0) {
      console.log('    - 设备API请求失败，返回状态码:', failedCalls.map(c => c.status).join(','));
    } else if (successCalls.length === 0) {
      console.log('    - 没有任何设备API请求发出');
    } else {
      console.log('    - 设备API成功但页面仍显示0，可能是前端代码问题');
    }
    console.log('\n  注意: 此Bug需要修复并重新部署才能生效');
    console.log('  当前生产环境代码可能尚未更新');
  } else {
    console.log('  ✓ Bug已修复: 设备总数正确显示为', total);

    const online = parseInt(onlineDevices) || 0;
    const offline = parseInt(offlineDevices) || 0;

    if (online + offline === total) {
      console.log('  ✓ 在线+离线=总数，计算正确');
    } else {
      console.log('  ✗ 在线+离线≠总数:', `${online}+${offline}=${online+offline}≠${total}`);
    }
  }

  await page.screenshot({ path: 'test-results/verify-dashboard-fix.png', fullPage: true });
  console.log('\n  截图保存: test-results/verify-dashboard-fix.png');

  console.log('\n' + '='.repeat(80));
});

test('验证设备管理温度列', async ({ page }) => {
  console.log('\n' + '='.repeat(80));
  console.log('  验证设备管理温度列显示');
  console.log('='.repeat(80) + '\n');

  // 登录
  await page.goto(`${PROD_URL}/login`);
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });

  // 导航到设备管理
  console.log('[步骤 1] 导航到设备管理');
  await page.goto(`${PROD_URL}/devices`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 检查表格
  console.log('\n[步骤 2] 检查表格显示');
  const tableHeaders = await page.locator('.ant-table-thead th').allTextContents();
  console.log('  表头:', tableHeaders.join(' | '));

  // 检查温度列
  const tempIndex = tableHeaders.findIndex(h => h.includes('温度'));
  if (tempIndex >= 0) {
    console.log('  ✓ 温度列存在，索引:', tempIndex);

    // 统计温度显示情况
    const rows = await page.locator('.ant-table-tbody tr').all();
    let tempWithValue = 0;
    let tempWithDash = 0;
    const tempValues: string[] = [];

    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const row = rows[i];
      const cells = await row.locator('td').allTextContents();
      const tempValue = cells[tempIndex]?.trim();

      if (tempValue && tempValue !== '-' && tempValue !== '') {
        tempWithValue++;
        tempValues.push(tempValue);
      } else {
        tempWithDash++;
      }
    }

    console.log('  温度有值的设备:', tempWithValue);
    console.log('  温度为"-"的设备:', tempWithDash);

    if (tempWithValue > 0) {
      console.log('  ✓ 有设备显示温度数值:', tempValues.slice(0, 5).join(', '));
    } else {
      console.log('  ? 所有显示的设备温度为空（可能这些设备没有实时数据）');
    }
  } else {
    console.log('  ✗ 温度列不存在');
  }

  // 检查空调状态列
  console.log('\n[步骤 3] 检查空调状态列');
  const acIndex = tableHeaders.findIndex(h => h.includes('空调状态'));
  if (acIndex >= 0) {
    console.log('  ✓ 空调状态列存在，索引:', acIndex);

    const openTags = await page.locator('.ant-tag').filter({ hasText: '开启' }).count();
    const closeTags = await page.locator('.ant-tag').filter({ hasText: '关闭' }).count();
    console.log('  开启状态:', openTags);
    console.log('  关闭状态:', closeTags);
  }

  await page.screenshot({ path: 'test-results/verify-devices-temp.png', fullPage: true });
  console.log('\n  截图保存: test-results/verify-devices-temp.png');

  console.log('\n' + '='.repeat(80));
});